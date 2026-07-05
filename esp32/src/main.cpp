#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>
#if __has_include("secrets.local.h")
#include "secrets.local.h"
#else
#error "Missing esp32/include/secrets.local.h. Copy esp32/include/secrets.example.h to secrets.local.h and fill local values."
#endif

/* ========= WiFi 設定 ========= */
const char *WIFI_AP_NAME = "ESP32-PUMP-SETUP";

/* ========= 裝置設定 ========= */
const char *DEVICE_ID = "ESP32-A1";

/* ========= 繼電器設定 ========= */
const int RELAY_PIN = 26;
const bool RELAY_ACTIVE_LOW = true; // 常見繼電器：LOW=吸合
const unsigned long PULSE_MS = 300; // 保留給脈衝式繼電器需求

/* ========= 感測器設定 ========= */
const int SOIL_PIN = 36;
const int WATER_PIN = 32;
const int SOIL_DRY = 3600;
const int SOIL_WET = 1200;

#if defined(ADC_11db)
#define ADC_ATTEN_VAL ADC_11db
#elif defined(ADC_ATTEN_DB_11)
#define ADC_ATTEN_VAL ADC_ATTEN_DB_11
#else
#define ADC_ATTEN_VAL ((adc_attenuation_t)3)
#endif

/* ========= 輪詢設定 ========= */
const unsigned long WIFI_RECONNECT_MS = 10000;
const unsigned long COMMAND_POLL_MS = 2000;
const unsigned long TELEMETRY_POST_MS = 5000;
const unsigned long CONFIG_POLL_MS = 10000;
const unsigned long SENSOR_CHECK_MS = 1000;
const unsigned long SAFE_BOOT_DELAY = 10000;
const unsigned long HOLD_MS = 30000;
const unsigned long TANK_BLANK_MS = 200;
const unsigned long TANK_DEBOUNCE_MS = 100;
const unsigned long NOTIFY_REPEAT_MS = 600000;

WiFiManager wm;
bool autoMode = false;
bool pumpState = false;
bool isPulsing = false;
bool manualOverride = false;
bool overridePump = false;
bool prevNoWater = false;
bool telemetryUrgent = false;
int soilRaw = 0;
int soilPercent = 50;
bool tankHasWater = true;
bool tankRawPrev = true;
bool tankFiltered = true;
int cfgMoistOn = 40;
int cfgMoistOff = 60;
int cfgPumpMs = 5000;
bool cfgNotifyEnabled = true;
bool hasDeviceConfig = false;

String lastCommandId = "";
unsigned long lastWifiAttempt = 0;
unsigned long lastCommandPoll = 0;
unsigned long lastTelemetryPost = 0;
unsigned long lastConfigPoll = 0;
unsigned long lastSensorCheck = 0;
unsigned long bootTime = 0;
unsigned long pumpStart = 0;
unsigned long pumpSwitchAt = 0;
unsigned long levelLastEdge = 0;
unsigned long overrideUntil = 0;
unsigned long lastNoWaterNotify = 0;
unsigned long lastDryNotify = 0;
int wifiFailCount = 0;
WiFiClientSecure tls;
bool wifiManagerReady = false;

/* ========= 繼電器控制 ========= */
void relayOn()
{
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? LOW : HIGH);
}

void relayOff()
{
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
}

void pulseRelay()
{
    if (isPulsing)
        return;
    isPulsing = true;

    Serial.println("[RELAY] Pulse start");
    relayOn();
    delay(PULSE_MS);
    relayOff();
    Serial.println("[RELAY] Pulse end");

    isPulsing = false;
}

void setPump(bool on)
{
    pumpState = on;
    if (pumpState)
    {
        Serial.println("[PUMP] ON");
        relayOn();
    }
    else
    {
        Serial.println("[PUMP] OFF");
        relayOff();
    }
    pumpSwitchAt = millis();
    telemetryUrgent = true;
}

/* ========= WiFi ========= */
void connectWiFi()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        wifiFailCount = 0;
        wifiManagerReady = true;
        return;
    }

    unsigned long now = millis();
    if (lastWifiAttempt != 0 && now - lastWifiAttempt < WIFI_RECONNECT_MS)
        return;
    lastWifiAttempt = now;

    Serial.println("[WIFI] Connecting...");

    if (!wifiManagerReady)
    {
        wm.setDebugOutput(true);
        wm.setConfigPortalTimeout(180);
        wm.setConnectTimeout(20);
        wm.setWiFiAutoReconnect(true);
        wm.setRestorePersistent(true);

        bool ok = wm.autoConnect(WIFI_AP_NAME);
        if (ok)
        {
            wifiManagerReady = true;
            wifiFailCount = 0;
            Serial.print("[WIFI] Connected, IP = ");
            Serial.println(WiFi.localIP());
            return;
        }

        Serial.println("[WIFI] WiFiManager portal failed or timed out");
        return;
    }

    WiFi.reconnect();
    wifiFailCount++;
    Serial.print("[WIFI] reconnect fail count = ");
    Serial.println(wifiFailCount);

    if (wifiFailCount >= 3)
    {
        Serial.println("[WIFI] Restart WiFi module");
        WiFi.disconnect(true);
        WiFi.mode(WIFI_OFF);
        delay(1000);
        WiFi.mode(WIFI_STA);
        wifiFailCount = 0;
        WiFi.reconnect();
    }
}

void printWiFiStatus()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.print("[WIFI] Connected, IP = ");
        Serial.println(WiFi.localIP());
    }
    else
    {
        Serial.print("[WIFI] Not connected, status = ");
        Serial.println(WiFi.status());
    }
}

bool ensureCloudReady()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("[HTTP] Skip: WiFi not connected");
        return false;
    }

    if (String(SUPABASE_KEY).length() == 0)
    {
        Serial.println("[HTTP] Skip: SUPABASE_KEY is empty");
        return false;
    }

    return true;
}

String restUrl(const String &pathAndQuery)
{
    return String(SUPABASE_URL) + "/rest/v1/" + pathAndQuery;
}

void addSupabaseHeaders(HTTPClient &http)
{
    http.addHeader("apikey", SUPABASE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Accept", "application/json");
}

/* ========= 簡易 JSON 讀取 ========= */
String extractJsonValue(const String &json, const String &key)
{
    String pattern = "\"" + key + "\":";
    int start = json.indexOf(pattern);
    if (start < 0)
        return "";

    start += pattern.length();
    while (start < json.length() && isspace(json[start]))
        start++;
    if (start >= json.length())
        return "";

    if (json[start] == '"')
    {
        int valueStart = start + 1;
        int valueEnd = json.indexOf('"', valueStart);
        if (valueEnd < 0)
            return "";
        return json.substring(valueStart, valueEnd);
    }

    int valueEnd = start;
    while (valueEnd < json.length())
    {
        char c = json[valueEnd];
        if (c == ',' || c == '}' || c == ']')
            break;
        valueEnd++;
    }

    String value = json.substring(start, valueEnd);
    value.trim();
    return value;
}

bool hasJsonKey(const String &json, const String &key)
{
    return json.indexOf("\"" + key + "\":") >= 0;
}

bool jsonBoolIsTrue(const String &json, const String &key)
{
    return extractJsonValue(json, key) == "true";
}

bool jsonBoolIsFalse(const String &json, const String &key)
{
    return extractJsonValue(json, key) == "false";
}

bool jsonIntValue(const String &json, const String &key, int &out)
{
    String value = extractJsonValue(json, key);
    if (value.length() == 0 || value == "null")
        return false;

    out = value.toInt();
    return true;
}

void printDeviceConfig()
{
    Serial.print("[CFG] moist_on = ");
    Serial.print(cfgMoistOn);
    Serial.print(", moist_off = ");
    Serial.print(cfgMoistOff);
    Serial.print(", pump_ms = ");
    Serial.print(cfgPumpMs);
    Serial.print(", notify_enabled = ");
    Serial.println(cfgNotifyEnabled ? "true" : "false");
}

int readMedianSoilRaw(int samples = 9)
{
    int values[25];
    if (samples > 25)
        samples = 25;
    if (samples < 1)
        samples = 1;

    for (int i = 0; i < samples; i++)
    {
        values[i] = analogRead(SOIL_PIN);
        delay(3);
    }

    for (int i = 1; i < samples; i++)
    {
        int key = values[i];
        int j = i - 1;
        while (j >= 0 && values[j] > key)
        {
            values[j + 1] = values[j];
            j--;
        }
        values[j + 1] = key;
    }

    return values[samples / 2];
}

int soilRawToPercent(int raw)
{
    if (SOIL_DRY == SOIL_WET)
        return 0;

    float pct = (float)(SOIL_DRY - raw) * 100.0f / (float)(SOIL_DRY - SOIL_WET);
    if (pct < 0)
        pct = 0;
    if (pct > 100)
        pct = 100;
    return int(pct + 0.5f);
}

int readSoilPercent()
{
    soilRaw = readMedianSoilRaw();
    soilPercent = soilRawToPercent(soilRaw);

    Serial.print("[SOIL] raw = ");
    Serial.print(soilRaw);
    Serial.print(", percent = ");
    Serial.println(soilPercent);

    return soilPercent;
}

bool readTankRaw()
{
    return digitalRead(WATER_PIN) == LOW;
}

bool readTankHasWater()
{
    int raw = digitalRead(WATER_PIN);
    unsigned long now = millis();
    bool current = (raw == LOW);

    if (now - pumpSwitchAt < TANK_BLANK_MS)
    {
        tankHasWater = tankFiltered;
    }
    else
    {
        if (current != tankRawPrev)
        {
            tankRawPrev = current;
            levelLastEdge = now;
        }

        if (now - levelLastEdge >= TANK_DEBOUNCE_MS)
            tankFiltered = current;

        tankHasWater = tankFiltered;
    }

    Serial.print("[TANK] raw = ");
    Serial.print(raw);
    Serial.print(", has_water = ");
    Serial.println(tankHasWater ? "true" : "false");

    return tankHasWater;
}

void sendLineAlert(const String &text)
{
    if (!cfgNotifyEnabled)
    {
        Serial.println("[LINE] notify disabled, skip");
        return;
    }

    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("[LINE] Skip: WiFi not connected");
        return;
    }

    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    if (!http.begin(client, "https://api.line.me/v2/bot/message/push"))
    {
        Serial.println("[LINE] http.begin failed");
        return;
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + LINE_TOKEN);

    String body = String("{\"to\":\"") + LINE_USER_ID + "\"," +
                  "\"messages\":[{\"type\":\"text\",\"text\":\"" + text + "\"}]}";

    int code = http.POST(body);
    String response = http.getString();

    Serial.print("[LINE] HTTP ");
    Serial.println(code);
    if (response.length() > 0)
    {
        Serial.print("[LINE] Response: ");
        Serial.println(response);
    }

    http.end();
}

void updatePumpAutoControl(int soilPct)
{
    bool hasWater = readTankHasWater();
    bool noWater = !hasWater;

    if (noWater)
    {
        if (pumpState)
        {
            setPump(false);
            Serial.println("[AUTO] Pump forced off: no water");
        }

        manualOverride = false;

        if (!prevNoWater)
        {
            sendLineAlert("AutoWater 警報：水箱缺水，請立即補水！");
            lastNoWaterNotify = millis();
        }
        else if (millis() - lastNoWaterNotify > NOTIFY_REPEAT_MS)
        {
            sendLineAlert("AutoWater 提醒：水箱仍然缺水，請儘快補水！");
            lastNoWaterNotify = millis();
        }

        prevNoWater = true;
        return;
    }

    if (prevNoWater)
        sendLineAlert("AutoWater：水箱水位恢復正常");
    prevNoWater = false;

    if (manualOverride && !autoMode)
    {
        setPump(overridePump);
        if (millis() >= overrideUntil)
            manualOverride = false;
        return;
    }

    if (millis() - bootTime < SAFE_BOOT_DELAY || !autoMode)
        return;

    if (!pumpState && soilPct <= cfgMoistOn)
    {
        setPump(true);
        pumpStart = millis();
        Serial.println("[AUTO] Pump ON");
        sendLineAlert("AutoWater：自動澆水啟動，目前濕度 " + String(soilPct) + "%");
    }

    if (pumpState && (soilPct >= cfgMoistOff || millis() - pumpStart >= (unsigned long)cfgPumpMs))
    {
        setPump(false);
        Serial.println("[AUTO] Pump OFF");
        sendLineAlert("AutoWater：自動澆水結束，目前濕度 " + String(soilPct) + "%");
    }

    if (soilPct <= cfgMoistOn && millis() - lastDryNotify > NOTIFY_REPEAT_MS)
    {
        sendLineAlert("AutoWater 提醒：土壤過乾，目前濕度 " + String(soilPct) + "%");
        lastDryNotify = millis();
    }
}

/* ========= device_cfg 輪詢 ========= */
void loadDeviceConfig()
{
    if (!ensureCloudReady())
        return;

    HTTPClient http;
    String url = restUrl(
        "device_cfg"
        "?select=moist_on,moist_off,pump_ms,notify_enabled"
        "&device_id=eq." +
        String(DEVICE_ID) +
        "&limit=1");

    if (!http.begin(url))
    {
        Serial.println("[CFG] http.begin failed");
        return;
    }

    addSupabaseHeaders(http);

    int code = http.GET();
    String response = http.getString();

    Serial.print("[CFG] HTTP ");
    Serial.println(code);

    if (code < 200 || code >= 300)
    {
        Serial.print("[CFG] Supabase error: ");
        Serial.println(response);
        http.end();
        return;
    }

    http.end();

    if (response == "[]" || response.length() < 4)
    {
        hasDeviceConfig = false;
        Serial.println("[CFG] No device_cfg row, using defaults");
        printDeviceConfig();
        return;
    }

    int nextMoistOn = cfgMoistOn;
    int nextMoistOff = cfgMoistOff;
    int nextPumpMs = cfgPumpMs;

    jsonIntValue(response, "moist_on", nextMoistOn);
    jsonIntValue(response, "moist_off", nextMoistOff);
    jsonIntValue(response, "pump_ms", nextPumpMs);

    if (hasJsonKey(response, "notify_enabled"))
    {
        if (jsonBoolIsTrue(response, "notify_enabled"))
            cfgNotifyEnabled = true;
        else if (jsonBoolIsFalse(response, "notify_enabled"))
            cfgNotifyEnabled = false;
    }

    cfgMoistOn = nextMoistOn;
    cfgMoistOff = nextMoistOff;
    cfgPumpMs = nextPumpMs;
    hasDeviceConfig = true;

    printDeviceConfig();
}

/* ========= Telemetry ========= */
bool postTelemetry(const char *reason)
{
    if (!ensureCloudReady())
        return false;

    HTTPClient http;
    String url = restUrl("telemetry");

    Serial.print("[TELEMETRY] POST reason = ");
    Serial.println(reason);

    if (!http.begin(url))
    {
        Serial.println("[TELEMETRY] http.begin failed");
        return false;
    }

    addSupabaseHeaders(http);
    http.addHeader("Prefer", "return=minimal");

    String body = "{";
    body += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    body += "\"soil\":" + String(readSoilPercent()) + ",";
    body += "\"tank\":" + String(readTankHasWater() ? "true" : "false") + ",";
    body += "\"pump\":" + String(pumpState ? "true" : "false") + ",";
    body += "\"auto\":" + String(autoMode ? "true" : "false");
    body += "}";

    int code = http.POST(body);
    String response = http.getString();

    Serial.print("[TELEMETRY] HTTP ");
    Serial.println(code);
    if (response.length() > 0)
    {
        Serial.print("[TELEMETRY] Response: ");
        Serial.println(response);
    }

    http.end();
    return code >= 200 && code < 300;
}

/* ========= device_cmd 輪詢 ========= */
void pollLatestCommand()
{
    if (!ensureCloudReady())
        return;

    HTTPClient http;
    String url = restUrl(
        "device_cmd"
        "?select=id,pump,auto,created_at"
        "&device_id=eq." +
        String(DEVICE_ID) +
        "&order=created_at.desc"
        "&limit=1");

    if (!http.begin(url))
    {
        Serial.println("[CMD] http.begin failed");
        return;
    }

    addSupabaseHeaders(http);

    int code = http.GET();
    String response = http.getString();

    Serial.print("[CMD] HTTP ");
    Serial.println(code);

    if (code < 200 || code >= 300)
    {
        Serial.print("[CMD] Supabase error: ");
        Serial.println(response);
        http.end();
        return;
    }

    http.end();

    if (response == "[]" || response.length() < 4)
    {
        Serial.println("[CMD] No command");
        return;
    }

    String commandId = extractJsonValue(response, "id");
    Serial.print("[CMD] Latest id = ");
    Serial.println(commandId.length() ? commandId : "(missing)");

    if (commandId.length() == 0)
    {
        Serial.print("[CMD] Unexpected response: ");
        Serial.println(response);
        return;
    }

    if (commandId == lastCommandId)
    {
        Serial.println("[CMD] Duplicate command, skip");
        return;
    }

    lastCommandId = commandId;

    bool changed = false;

    if (hasJsonKey(response, "auto"))
    {
        String autoValue = extractJsonValue(response, "auto");
        Serial.print("[CMD] auto = ");
        Serial.println(autoValue);

        if (jsonBoolIsTrue(response, "auto"))
        {
            autoMode = true;
            manualOverride = false;
            setPump(false);
            changed = true;
            Serial.println("[MODE] AUTO");
            sendLineAlert("AutoWater 已切換為自動模式");
        }
        else if (jsonBoolIsFalse(response, "auto"))
        {
            autoMode = false;
            changed = true;
            Serial.println("[MODE] MANUAL");
            sendLineAlert("AutoWater 已切換為手動模式");
        }
        else
        {
            Serial.println("[CMD] auto is null or unsupported");
        }
    }

    if (hasJsonKey(response, "pump"))
    {
        String pumpValue = extractJsonValue(response, "pump");
        Serial.print("[CMD] pump = ");
        Serial.println(pumpValue);

        if (jsonBoolIsTrue(response, "pump"))
        {
            if (autoMode)
            {
                Serial.println("[CMD] pump ignored, autoMode=true");
            }
            else
            {
                manualOverride = true;
                overridePump = true;
                overrideUntil = millis() + HOLD_MS;
                setPump(true);
                sendLineAlert("AutoWater：手動開啟水泵");
                changed = true;
            }
        }
        else if (jsonBoolIsFalse(response, "pump"))
        {
            if (autoMode)
            {
                Serial.println("[CMD] pump ignored, autoMode=true");
            }
            else
            {
                manualOverride = true;
                overridePump = false;
                overrideUntil = millis() + HOLD_MS;
                setPump(false);
                sendLineAlert("AutoWater：手動關閉水泵");
                changed = true;
            }
        }
        else
        {
            Serial.println("[CMD] pump is null or unsupported");
        }
    }

    if (changed)
    {
        postTelemetry("command");
    }
    else
    {
        Serial.println("[CMD] No executable field in latest command");
    }
}

/* ========= SETUP ========= */
void setup()
{
    Serial.begin(115200);
    delay(300);

    Serial.println();
    Serial.println("=== ESP32 SUPABASE PUMP CONTROL ===");
    Serial.print("[DEVICE] DEVICE_ID = ");
    Serial.println(DEVICE_ID);

    tls.setInsecure();
    WiFi.setAutoReconnect(true);
    WiFi.persistent(true);
    WiFi.setSleep(false);

    analogSetWidth(12);
    analogSetPinAttenuation(SOIL_PIN, ADC_ATTEN_VAL);

    pinMode(RELAY_PIN, OUTPUT);
    pinMode(SOIL_PIN, INPUT);
    pinMode(WATER_PIN, INPUT_PULLUP);
    relayOff();

    tankRawPrev = readTankRaw();
    tankFiltered = tankRawPrev;
    tankHasWater = tankFiltered;
    bootTime = millis();

    WiFi.mode(WIFI_STA);
    connectWiFi();
}

/* ========= LOOP ========= */
void loop()
{
    connectWiFi();

    static wl_status_t lastStatus = WL_IDLE_STATUS;
    wl_status_t status = WiFi.status();
    static unsigned long lastWifiDebug = 0;
    if (millis() - lastWifiDebug >= 2000)
    {
        lastWifiDebug = millis();
        Serial.print("[WIFI] status = ");
        Serial.println(WiFi.status());
    }
    if (status != lastStatus)
    {
        lastStatus = status;
        printWiFiStatus();
        if (status == WL_CONNECTED)
        {
            postTelemetry("wifi_connected");
        }
    }

    unsigned long now = millis();

    if (now - lastSensorCheck >= SENSOR_CHECK_MS)
    {
        lastSensorCheck = now;
        int pct = readSoilPercent();
        updatePumpAutoControl(pct);
    }

    if (now - lastCommandPoll >= COMMAND_POLL_MS)
    {
        lastCommandPoll = now;
        pollLatestCommand();
    }

    if (now - lastConfigPoll >= CONFIG_POLL_MS)
    {
        lastConfigPoll = now;
        loadDeviceConfig();
    }

    if (now - lastTelemetryPost >= TELEMETRY_POST_MS)
    {
        lastTelemetryPost = now;
        postTelemetry("periodic");
    }
}
