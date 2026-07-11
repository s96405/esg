import { requireLogin, isAdmin, logout } from "../auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const appUser = await requireLogin();
if (!appUser) throw new Error("Login required");

const showName = (appUser.display_name && String(appUser.display_name).trim())
  ? appUser.display_name
  : (appUser.username || "使用者");

document.getElementById("welcomeName").textContent = showName;

const SUPABASE_URL = "https://jmimieqvhrdpdvovorhx.supabase.co";
const SUPABASE_KEY = "sb_publishable_23gcxoA6juzOJOQga7ZihQ_3kdW4wIc";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sideNav = document.getElementById("sideNav");

const navItems = [
  { href:"index.html", icon:"總", text:"儀表板" },
  { href:"control.html", icon:"控", text:"控制台" },
  { href:"history.html", icon:"歷", text:"歷史資料" },
  { href:"change_password.html", icon:"密", text:"修改密碼" },
];

if (isAdmin(appUser)){
  navItems.push({ href:"user.html", icon:"人", text:"使用者管理" });
}

sideNav.innerHTML = navItems.map(it => {
  const active = it.href === "index.html";
  return `
    <a class="${active ? "active" : ""}" href="${it.href}">
      <span class="ico">${it.icon}</span>
      <span>${it.text}</span>
    </a>
  `;
}).join("");

document.getElementById("sideLogout").onclick = (e) => {
  e.preventDefault();
  logout();
};

const btnMenu = document.getElementById("btnMenu");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");

if (btnMenu){
  btnMenu.onclick = () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  };

  overlay.onclick = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  };
}

sideNav.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
});

function updateClock(){
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  document.getElementById("topDate").textContent = `${yyyy}-${mm}-${dd}`;
  document.getElementById("topTime").textContent = `${hh}:${mi}:${ss}`;
}

updateClock();
setInterval(updateClock, 1000);

function fmtTime(ts){
  if (!ts) return "—";
  return new Date(ts).toLocaleString("zh-TW", { hour12:false });
}

function minutesAgo(ts){
  if (!ts) return Infinity;
  return (Date.now() - new Date(ts).getTime()) / 60000;
}

function safeNum(x){
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function formatAiStatus(status){
  if (status === "healthy") return "健康";
  if (status === "warning") return "注意";
  if (status === "danger") return "異常";
  return "未知";
}

function formatAiStatusClass(status){
  if (status === "healthy") return "ok";
  if (status === "warning") return "warn";
  if (status === "danger") return "danger";
  return "info";
}

const statDevicesEl = document.getElementById("statDevices");
const statOnlineEl = document.getElementById("statOnline");
const statOfflineEl = document.getElementById("statOffline");
const statAlertsEl = document.getElementById("statAlerts");
const statDryEl = document.getElementById("statDry");
const statNoWaterEl = document.getElementById("statNoWater");
const alertsBodyEl = document.getElementById("alertsBody");
const lastRefreshEl = document.getElementById("lastRefresh");
const avgSoilNowEl = document.getElementById("avgSoilNow");
const alertsNowEl = document.getElementById("alertsNow");

const healthPanelEl = document.getElementById("healthPanel");
const healthBadgeEl = document.getElementById("healthBadge");
const healthTitleEl = document.getElementById("healthTitle");
const healthSummaryEl = document.getElementById("healthSummary");
const healthSoilEl = document.getElementById("healthSoil");
const healthUpdatedEl = document.getElementById("healthUpdated");

const soilSignalEl = document.getElementById("soilSignal");
const soilSignalValueEl = document.getElementById("soilSignalValue");
const soilSignalMetaEl = document.getElementById("soilSignalMeta");

const waterSignalEl = document.getElementById("waterSignal");
const waterSignalValueEl = document.getElementById("waterSignalValue");
const waterSignalMetaEl = document.getElementById("waterSignalMeta");

const autoSignalEl = document.getElementById("autoSignal");
const autoSignalValueEl = document.getElementById("autoSignalValue");
const autoSignalMetaEl = document.getElementById("autoSignalMeta");

const connectionSignalEl = document.getElementById("connectionSignal");
const connectionSignalValueEl = document.getElementById("connectionSignalValue");
const connectionSignalMetaEl = document.getElementById("connectionSignalMeta");

const aiMetricTimeEl = document.getElementById("aiMetricTime");
const aiLeafCoverEl = document.getElementById("aiLeafCover");
const aiRedRatioEl = document.getElementById("aiRedRatio");
const aiStatusEl = document.getElementById("aiStatus");
const aiMetricNoticeEl = document.getElementById("aiMetricNotice");

function setStateClass(el, state){
  if (!el) return;
  el.classList.remove("ok", "warn", "danger", "info", "empty");
  if (state) el.classList.add(state);
}

function buildSparkPoints(values){
  const n = values.length;
  if (!n) return "";

  const w = 100;
  const h = 90;
  const stepX = n === 1 ? 0 : w / (n - 1);
  const valid = values.map(v => (v === null || v === undefined) ? null : v);

  let min = Infinity;
  let max = -Infinity;

  valid.forEach(v => {
    if (v === null) return;
    min = Math.min(min, v);
    max = Math.max(max, v);
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)){
    min = 0;
    max = 1;
  }

  if (max === min) max = min + 1;

  return valid.map((v, i) => {
    const x = stepX * i;
    const vv = v === null ? min : v;
    const t = (vv - min) / (max - min);
    const y = h - t * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function setSpark(polyId, areaId, points){
  const poly = document.getElementById(polyId);
  const area = document.getElementById(areaId);
  const empty = document.getElementById(`${polyId}Empty`);

  if (!poly || !area) return;

  poly.setAttribute("points", points || "");

  if (empty) empty.hidden = !!points;
  poly.classList.toggle("is-empty", !points);

  if (!points){
    area.setAttribute("points", "");
    return;
  }

  const arr = points.split(" ");
  const first = arr[0].split(",")[0];
  const last = arr[arr.length - 1].split(",")[0];

  area.setAttribute("points", `${first},90 ${points} ${last},90`);
}

async function getUserDeviceIds(){
  let q = supabase.from("user_devices").select("device_id");

  if (appUser.user_id){
    q = q.eq("user_id", appUser.user_id);
  }

  const { data, error } = await q;

  if (error){
    console.error("[user_devices] load failed:", error);
    return [];
  }

  return (data || []).map(r => r.device_id).filter(Boolean);
}

async function loadLatestCameraMetric(deviceId){
  const { data, error } = await supabase
    .from("camera_metrics")
    .select("captured_at, leaf_cover, red_ratio, status")
    .eq("device_id", deviceId)
    .order("captured_at", { ascending:false })
    .limit(1);

  if (error){
    console.error("[camera_metrics] load failed:", error);
    return null;
  }

  return data && data.length ? data[0] : null;
}

function renderCameraMetric(metric){
  if (!aiLeafCoverEl || !aiRedRatioEl || !aiStatusEl || !aiMetricTimeEl || !aiMetricNoticeEl){
    return;
  }

  aiStatusEl.classList.remove("ok", "warn", "danger", "info");

  if (!metric){
    aiLeafCoverEl.textContent = "—";
    aiRedRatioEl.textContent = "—";
    aiStatusEl.textContent = "—";
    aiMetricTimeEl.textContent = "—";
    aiMetricNoticeEl.textContent = "尚無影像分析資料";
    aiStatusEl.classList.add("info");
    return;
  }

  const leaf = safeNum(metric.leaf_cover);
  const red = safeNum(metric.red_ratio);
  const status = metric.status || "unknown";

  aiLeafCoverEl.textContent = leaf === null ? "—" : `${leaf.toFixed(1)}%`;
  aiRedRatioEl.textContent = red === null ? "—" : `${red.toFixed(1)}%`;
  aiStatusEl.textContent = formatAiStatus(status);
  aiStatusEl.classList.add(formatAiStatusClass(status));
  aiMetricTimeEl.textContent = fmtTime(metric.captured_at);

  if (status === "healthy"){
    aiMetricNoticeEl.textContent = "影像分析顯示植物狀態穩定。";
  }else if (status === "warning"){
    aiMetricNoticeEl.textContent = "影像分析顯示植物狀態需要留意。";
  }else if (status === "danger"){
    aiMetricNoticeEl.textContent = "影像分析顯示葉色異常比例偏高，建議檢查光照、水分或葉片狀態。";
  }else{
    aiMetricNoticeEl.textContent = "已取得影像分析資料。";
  }
}

sideNav.querySelectorAll("a").forEach(a => {
  if (a.getAttribute("href") === "control.html"){
    a.addEventListener("click", async (e) => {
      e.preventDefault();

      const deviceIds = await getUserDeviceIds();

      if (!deviceIds.length){
        alert("尚未綁定任何設備（user_devices 無資料）");
        return;
      }

      location.href = `control.html?device_id=${encodeURIComponent(deviceIds[0])}`;
    });
  }
});

function updateHealthOverview({
  total,
  online,
  offline,
  alerts,
  dry,
  nowater,
  avg,
  avgThreshold,
  autoOn,
  autoKnown,
  waterOk,
  waterKnown
}){
  const updatedText = fmtTime(new Date());

  if (healthUpdatedEl) healthUpdatedEl.textContent = updatedText;
  if (lastRefreshEl) lastRefreshEl.textContent = updatedText;

  if (!total){
    setStateClass(healthPanelEl, "empty");

    if (healthBadgeEl) healthBadgeEl.textContent = "尚未綁定";
    if (healthTitleEl) healthTitleEl.textContent = "尚未綁定任何設備";
    if (healthSummaryEl) healthSummaryEl.textContent = "請先綁定設備，系統才會顯示植物健康與澆水狀態。";
    if (healthSoilEl) healthSoilEl.textContent = "—";

    setStateClass(soilSignalEl, "info");
    setStateClass(waterSignalEl, "info");
    setStateClass(autoSignalEl, "info");
    setStateClass(connectionSignalEl, "info");

    if (soilSignalValueEl) soilSignalValueEl.textContent = "—";
    if (soilSignalMetaEl) soilSignalMetaEl.textContent = "尚無設備資料";
    if (waterSignalValueEl) waterSignalValueEl.textContent = "—";
    if (waterSignalMetaEl) waterSignalMetaEl.textContent = "尚無設備資料";
    if (autoSignalValueEl) autoSignalValueEl.textContent = "—";
    if (autoSignalMetaEl) autoSignalMetaEl.textContent = "尚無設備資料";
    if (connectionSignalValueEl) connectionSignalValueEl.textContent = "0 / 0";
    if (connectionSignalMetaEl) connectionSignalMetaEl.textContent = "尚無設備資料";

    return;
  }

  const needsAction = offline > 0 || nowater > 0;
  const needsAttention = !needsAction && dry > 0;
  const healthState = needsAction ? "danger" : (needsAttention ? "warn" : "ok");

  setStateClass(healthPanelEl, healthState);

  if (healthBadgeEl){
    healthBadgeEl.textContent = healthState === "ok"
      ? "健康"
      : (healthState === "warn" ? "注意" : "需要處理");
  }

  if (healthTitleEl){
    healthTitleEl.textContent = healthState === "ok"
      ? "植物狀態穩定"
      : (healthState === "warn" ? "部分植物需要留意" : "有設備需要立即處理");
  }

  if (healthSummaryEl){
    const parts = [
      `${online}/${total} 台設備在線`,
      nowater ? `${nowater} 台水位不足` : "水位正常",
      dry ? `${dry} 台土壤偏乾` : "濕度正常"
    ];

    healthSummaryEl.textContent = parts.join("，") + "。";
  }

  if (healthSoilEl){
    healthSoilEl.textContent = avg === null ? "—" : `${avg.toFixed(1)}%`;
  }

  const soilState = avg === null ? "info" : (avg < avgThreshold ? "warn" : "ok");
  setStateClass(soilSignalEl, soilState);

  if (soilSignalValueEl){
    soilSignalValueEl.textContent = avg === null ? "—" : `${avg.toFixed(1)}%`;
  }

  if (soilSignalMetaEl){
    soilSignalMetaEl.textContent = avg === null ? "尚無濕度資料" : `平均門檻 ${avgThreshold.toFixed(0)}%`;
  }

  const waterState = !waterKnown ? "info" : (nowater > 0 ? "danger" : "ok");
  setStateClass(waterSignalEl, waterState);

  if (waterSignalValueEl){
    waterSignalValueEl.textContent = !waterKnown ? "—" : (nowater > 0 ? `${nowater} 台缺水` : "水位正常");
  }

  if (waterSignalMetaEl){
    waterSignalMetaEl.textContent = waterKnown ? `${waterOk} 台有水 / ${nowater} 台缺水` : "尚無水位資料";
  }

  const autoState = !autoKnown ? "info" : "ok";
  setStateClass(autoSignalEl, autoState);

  if (autoSignalValueEl){
    autoSignalValueEl.textContent = !autoKnown ? "—" : `${autoOn} 台自動`;
  }

  if (autoSignalMetaEl){
    autoSignalMetaEl.textContent = autoKnown ? `${autoKnown - autoOn} 台手動 / ${total - autoKnown} 台未回報` : "尚無模式資料";
  }

  const connectionState = offline > 0 ? "danger" : "ok";
  setStateClass(connectionSignalEl, connectionState);

  if (connectionSignalValueEl){
    connectionSignalValueEl.textContent = `${online} / ${total}`;
  }

  if (connectionSignalMetaEl){
    connectionSignalMetaEl.textContent = offline > 0 ? `${offline} 台超過 15 分鐘未回傳` : "所有設備最近有回傳";
  }
}

async function loadDashboard(){
  const deviceIds = await getUserDeviceIds();
  statDevicesEl.textContent = deviceIds.length;

  if (!deviceIds.length){
    renderCameraMetric(null);

    statOnlineEl.textContent = 0;
    statOfflineEl.textContent = 0;
    statAlertsEl.textContent = 0;
    statDryEl.textContent = 0;
    statNoWaterEl.textContent = 0;

    alertsBodyEl.innerHTML = `
      <tr>
        <td colspan="5" class="muted">尚未綁定任何設備（user_devices 無資料）</td>
      </tr>
    `;

    setSpark("sparkSoil", "sparkSoilArea", "");

    avgSoilNowEl.textContent = "—";
    alertsNowEl.textContent = "—";

    updateHealthOverview({
      total:0,
      online:0,
      offline:0,
      alerts:0,
      dry:0,
      nowater:0,
      avg:null,
      avgThreshold:30,
      autoOn:0,
      autoKnown:0,
      waterOk:0,
      waterKnown:0
    });

    return;
  }

  const cameraMetric = await loadLatestCameraMetric(deviceIds[0]);
  renderCameraMetric(cameraMetric);

  const { data: cfgRows, error: cfgError } = await supabase
    .from("device_cfg")
    .select("device_id, moist_on")
    .in("device_id", deviceIds);

  if (cfgError){
    console.error("[device_cfg] load failed:", cfgError);
  }

  const moistOnMap = {};

  (cfgRows || []).forEach(r => {
    const v = safeNum(r.moist_on);
    if (r.device_id && v !== null){
      moistOnMap[r.device_id] = v;
    }
  });

  let online = 0;
  let offline = 0;
  let dry = 0;
  let nowater = 0;
  let alerts = 0;
  let autoOn = 0;
  let autoKnown = 0;
  let waterOk = 0;
  let waterKnown = 0;

  const alertRows = [];
  const soilsForAvg = [];

  for (const id of deviceIds){
    const { data: telem, error: telemError } = await supabase
      .from("telemetry")
      .select("soil,tank,pump,auto,vbat,created_at")
      .eq("device_id", id)
      .order("created_at", { ascending:false })
      .limit(1);

    if (telemError){
      console.error("[telemetry] load failed:", telemError);
    }

    const row = telem && telem[0] ? telem[0] : null;
    const ts = row?.created_at || null;

    const mins = minutesAgo(ts);
    const isOnline = mins < 15;

    if (isOnline) online++;
    else offline++;

    const soil = safeNum(row?.soil);
    if (soil !== null) soilsForAvg.push(soil);

    const tank = row?.tank;
    const moistOn = moistOnMap[id] ?? 30;

    if (tank === true){
      waterOk++;
      waterKnown++;
    }

    if (tank === false){
      waterKnown++;
    }

    if (row?.auto === true){
      autoOn++;
      autoKnown++;
    }

    if (row?.auto === false){
      autoKnown++;
    }

    const isDry = soil !== null ? soil < moistOn : false;
    const isNoWater = tank === false;
    const isOffline = !isOnline;

    const types = [];

    if (isDry) types.push("過乾");
    if (isNoWater) types.push("缺水");
    if (isOffline) types.push("離線");

    const isAlert = types.length > 0;

    if (isDry) dry++;
    if (isNoWater) nowater++;
    if (isAlert) alerts++;

    if (isAlert){
      const badgeCls = (isOffline || isNoWater) ? "danger" : "warn";

      const summary = [
        `濕度：${soil === null ? "—" : (soil + "%")}（門檻 ${moistOn}%）`,
        `水位：${tank === null || tank === undefined ? "—" : (tank ? "有水" : "缺水")}`,
        `模式：${row?.auto === null || row?.auto === undefined ? "—" : (row.auto ? "自動" : "手動")}`,
        `水泵：${row?.pump ? "運轉中" : "停止"}`
      ].join(" · ");

      alertRows.push({
        device_id:id,
        types,
        summary,
        ts,
        badgeCls
      });
    }
  }

  statOnlineEl.textContent = online;
  statOfflineEl.textContent = offline;
  statAlertsEl.textContent = alerts;
  statDryEl.textContent = dry;
  statNoWaterEl.textContent = nowater;

  const avg = soilsForAvg.length
    ? soilsForAvg.reduce((a, b) => a + b, 0) / soilsForAvg.length
    : null;

  const avgThreshold = deviceIds.length
    ? deviceIds.reduce((sum, id) => sum + (moistOnMap[id] ?? 30), 0) / deviceIds.length
    : 30;

  if (!alertRows.length){
    alertsBodyEl.innerHTML = `
      <tr>
        <td colspan="5" class="muted">目前沒有告警（全部正常）</td>
      </tr>
    `;
  }else{
    alertRows.sort((a, b) => {
      const score = (r) =>
        (r.types.includes("離線") ? 100 : 0) +
        (r.types.includes("缺水") ? 50 : 0) +
        (r.types.includes("過乾") ? 10 : 0);

      return score(b) - score(a);
    });

    alertsBodyEl.innerHTML = alertRows.map(r => {
      const typeText = r.types.join("、");
      const badgeText = r.badgeCls === "danger" ? "嚴重" : "注意";

      return `
        <tr>
          <td data-label="設備"><b>${r.device_id}</b></td>
          <td data-label="狀態"><span class="badge ${r.badgeCls}">${badgeText} · ${typeText}</span></td>
          <td data-label="摘要" class="muted">${r.summary}</td>
          <td data-label="最後回傳" class="muted">${fmtTime(r.ts)}</td>
          <td data-label="操作"><button class="btn primary" data-go="${r.device_id}">前往控制台</button></td>
        </tr>
      `;
    }).join("");

    alertsBodyEl.querySelectorAll("[data-go]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-go");
        location.href = `control.html?device_id=${encodeURIComponent(id)}`;
      });
    });
  }

  avgSoilNowEl.textContent = avg === null ? "—" : `${avg.toFixed(1)}%`;
  alertsNowEl.textContent = `${alerts} 台`;

  updateHealthOverview({
    total:deviceIds.length,
    online,
    offline,
    alerts,
    dry,
    nowater,
    avg,
    avgThreshold,
    autoOn,
    autoKnown,
    waterOk,
    waterKnown
  });

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: trendRows, error: trendError } = await supabase
    .from("telemetry")
    .select("device_id, soil, created_at")
    .in("device_id", deviceIds)
    .gte("created_at", since)
    .order("created_at", { ascending:true })
    .limit(800);

  if (trendError){
    console.error("[telemetry trend] load failed:", trendError);
  }

  const buckets = new Map();

  (trendRows || []).forEach(r => {
    const soil = safeNum(r.soil);
    if (soil === null) return;

    const t = new Date(r.created_at).getTime();
    const k = Math.floor(t / (5 * 60 * 1000)) * (5 * 60 * 1000);

    const obj = buckets.get(k) || { sum:0, cnt:0 };
    obj.sum += soil;
    obj.cnt += 1;
    buckets.set(k, obj);
  });

  const keys = Array.from(buckets.keys()).sort((a, b) => a - b);
  const filled = [];

  if (keys.length){
    const start = keys[0];
    const end = keys[keys.length - 1];

    for (let k = start; k <= end; k += 5 * 60 * 1000){
      const obj = buckets.get(k);
      filled.push(obj ? (obj.sum / obj.cnt) : null);
    }
  }

  setSpark("sparkSoil", "sparkSoilArea", buildSparkPoints(filled));

  if (healthUpdatedEl){
    healthUpdatedEl.textContent = fmtTime(new Date());
  }
}

loadDashboard();
setInterval(loadDashboard, 10000);