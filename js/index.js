import { requireLogin, isAdmin, logout } from "../auth.js";
import { uiIcon } from "./ui-icons.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const appUser = await requireLogin();

if (!appUser) {
  throw new Error("Login required");
}

const showName =
  appUser.display_name && String(appUser.display_name).trim()
    ? appUser.display_name
    : appUser.username || "使用者";

document.getElementById("welcomeName").textContent = showName;

const SUPABASE_URL = "https://jmimieqvhrdpdvovorhx.supabase.co";
const SUPABASE_KEY =
  "sb_publishable_23gcxoA6juzOJOQga7ZihQ_3kdW4wIc";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   側邊選單
========================= */

const sideNav = document.getElementById("sideNav");

const navItems = [
  {
    href: "index.html",
    icon: "dashboard",
    text: "儀表板"
  },
  {
    href: "control.html",
    icon: "control",
    text: "控制台"
  },
  {
    href: "history.html",
    icon: "history",
    text: "歷史資料"
  },
  {
    href: "change_password.html",
    icon: "password",
    text: "修改密碼"
  }
];

if (isAdmin(appUser)) {
  navItems.push({
    href: "user.html",
    icon: "users",
    text: "使用者管理"
  });
}

sideNav.innerHTML = navItems
  .map((item) => {
    const active = item.href === "index.html";

    return `
      <a class="${active ? "active" : ""}" href="${item.href}">
        <span class="ico" aria-hidden="true">${uiIcon(item.icon)}</span>
        <span>${item.text}</span>
      </a>
    `;
  })
  .join("");

document.getElementById("sideLogout").onclick = (event) => {
  event.preventDefault();
  logout();
};

/* =========================
   手機版選單
========================= */

const btnMenu = document.getElementById("btnMenu");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");

if (btnMenu) {
  btnMenu.onclick = () => {
    sidebar.classList.add("open");
    overlay.classList.add("show");
  };
}

if (overlay) {
  overlay.onclick = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  };
}

sideNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });
});

/* =========================
   時鐘
========================= */

function updateClock() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  document.getElementById("topDate").textContent =
    `${yyyy}-${mm}-${dd}`;

  document.getElementById("topTime").textContent =
    `${hh}:${mi}:${ss}`;
}

updateClock();
setInterval(updateClock, 1000);

/* =========================
   共用工具
========================= */

function fmtTime(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("zh-TW", {
    hour12: false
  });
}

function minutesAgo(timestamp) {
  if (!timestamp) return Infinity;

  return (
    Date.now() -
    new Date(timestamp).getTime()
  ) / 60000;
}

function safeNum(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function safeSoilNum(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

const CARE_STATUS_LABELS = {
  unknown: "無法判定",
  danger: "需要處理",
  warning: "需要注意",
  healthy: "狀況良好"
};

function validMetric(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return safeNum(value);
}

function buildCareSummary(analysis) {
  if (!analysis) {
    return "目前沒有足夠資料，暫時無法完整判定植物與設備狀態。";
  }

  if (analysis.noTelemetry || analysis.telemetryOffline) {
    const imageNote = analysis.noCamera || analysis.cameraIncomplete
      ? "目前也缺少完整影像分析資料。"
      : analysis.cameraStatus === "danger"
        ? "最後一次影像分析顯示葉面覆蓋率偏低。"
        : "最後一次影像分析已有資料，但仍需設備恢復連線後再次確認。";
    return `目前設備${analysis.noTelemetry ? "沒有感測資料" : "離線"}，暫時無法完整判斷植物狀態。${imageNote}建議恢復設備連線後再次確認。`;
  }

  if (analysis.noCamera || analysis.cameraIncomplete) {
    return "目前影像分析資料不足，暫時無法完整判定植物狀態。設備感測資料可供參考，請確認影像分析資料是否正常產生。";
  }

  if (analysis.waterLow) {
    return "目前水箱水位不足，可能影響自動澆水。請先補充水箱水量，並持續確認土壤濕度變化。";
  }

  if (analysis.soilDry) {
    return "目前土壤濕度低於設定門檻，植物可能需要補充水分。請確認水箱水量與自動澆水功能是否正常。";
  }

  if (analysis.cameraStatus === "danger") {
    return "最後一次影像分析顯示葉面覆蓋率偏低，目前需要進一步確認。建議檢查拍攝角度、環境光線與植物現況。";
  }

  if (analysis.cameraStatus === "warning") {
    return "目前影像分析指標需要注意，但不代表病害診斷。建議持續觀察後續影像與環境資料變化。";
  }

  return "目前設備與照護狀態正常，未發現需要立即處理的問題。建議持續監測植物與環境變化。";
}

function buildCareAnalysis({
  telemetry,
  cameraMetrics,
  moistOn,
  now = new Date()
}) {
  const reasons = [];
  const recommendations = [];
  const cameraRows = Array.isArray(cameraMetrics)
    ? cameraMetrics
    : [];
  const latestCamera = cameraRows.length
    ? cameraRows[cameraRows.length - 1]
    : null;
  const latestLeaf = validMetric(latestCamera?.leaf_cover);
  const cameraStatus = latestCamera?.status
    ? String(latestCamera.status).toLowerCase()
    : null;
  const supportedCameraStatus = [
    "healthy",
    "normal",
    "warning",
    "danger"
  ].includes(cameraStatus);
  const telemetryTime = telemetry?.created_at
    ? new Date(telemetry.created_at).getTime()
    : NaN;
  const nowTime = now instanceof Date
    ? now.getTime()
    : new Date(now).getTime();
  const telemetryOffline = Boolean(telemetry) && (
    !Number.isFinite(telemetryTime) ||
    !Number.isFinite(nowTime) ||
    (nowTime - telemetryTime) / 60000 >= 15
  );
  const noTelemetry = !telemetry;
  const noCamera = !latestCamera;
  const cameraIncomplete = Boolean(latestCamera) && (
    !supportedCameraStatus ||
    latestLeaf === null
  );
  const soil = safeSoilNum(telemetry?.soil);
  const threshold = validMetric(moistOn) ?? 30;
  const soilDry = soil !== null && soil < threshold;
  const waterLow = telemetry?.tank === false;

  if (noTelemetry) {
    reasons.push({
      title: "設備感測資料不足",
      detail: "目前尚無設備回傳資料",
      severity: "info"
    });
  } else if (telemetryOffline) {
    reasons.push({
      title: "設備感測資料逾時",
      detail: "設備已超過 15 分鐘沒有回傳資料",
      severity: "danger"
    });
  }

  if (waterLow) {
    reasons.push({ title: "水箱水位不足", detail: "目前水箱無足夠水量", severity: "danger" });
  }

  if (soilDry) {
    reasons.push({ title: "土壤過乾", detail: "土壤濕度低於設定門檻", severity: "warning" });
  }

  if (noCamera || cameraIncomplete) {
    reasons.push({ title: "影像分析資料不足", detail: "目前無法取得完整影像分析結果", severity: "info" });
  } else if (cameraStatus === "warning") {
    reasons.push({ title: "影像指標需要注意", detail: "最後一次影像分析狀態為 warning", severity: "warning" });
  } else if (cameraStatus === "danger") {
    reasons.push({ title: "葉面覆蓋率過低", detail: "最後一次影像分析狀態為 danger", severity: "danger" });
  }

  if (noTelemetry || telemetryOffline) {
    recommendations.push({ title: "確認設備連線", detail: "請確認設備電源、Wi-Fi 與資料連線。", severity: "info" });
  }

  if (waterLow) {
    recommendations.push({ title: "補充水箱水量", detail: "請補充水箱水量，避免幫浦空轉。", severity: "danger" });
  }

  if (soilDry && !waterLow) {
    recommendations.push({ title: "確認自動澆水", detail: "目前土壤濕度偏低，請確認自動澆水是否正常運作。", severity: "warning" });
  }

  if (cameraStatus === "warning") {
    recommendations.push({ title: "持續觀察影像", detail: "影像指標需要注意，建議持續觀察後續變化。", severity: "warning" });
  }

  if (cameraStatus === "danger") {
    recommendations.push({ title: "再次確認影像", detail: "葉面覆蓋率偏低，建議檢查植物狀況、拍攝角度與環境光線。", severity: "danger" });
  }

  if (noCamera || cameraIncomplete) {
    recommendations.push({ title: "確認影像資料", detail: "請確認影像分析資料是否正常產生。", severity: "info" });
  }

  const insufficientData =
    noTelemetry ||
    telemetryOffline ||
    noCamera ||
    cameraIncomplete;

  let status = "healthy";

  if (insufficientData) {
    status = "unknown";
  } else if (waterLow || cameraStatus === "danger") {
    status = "danger";
  } else if (soilDry || cameraStatus === "warning") {
    status = "warning";
  }

  let score = null;

  if (!insufficientData) {
    score = 100;
    if (telemetryOffline) score -= 40;
    if (waterLow) score -= 30;
    if (soilDry) score -= 20;
    if (cameraStatus === "warning") score -= 10;
    if (cameraStatus === "danger") score -= 25;
    score = Math.max(0, score);
  }

  const validLeafRows = cameraRows
    .map((row) => validMetric(row?.leaf_cover))
    .filter((value) => value !== null);
  let leafTrend = "insufficient";
  let leafDelta = null;

  if (validLeafRows.length >= 2) {
    const current = validLeafRows[validLeafRows.length - 1];
    const previous = validLeafRows[validLeafRows.length - 2];
    leafDelta = current - previous;

    if (leafDelta > 1) {
      leafTrend = "up";
    } else if (leafDelta < -1) {
      leafTrend = "down";
    } else {
      leafTrend = "stable";
    }
  }

  if (!reasons.length) {
    reasons.push({ title: "目前無異常", detail: "未發現需要處理的狀況", severity: "healthy" });
  }

  if (!recommendations.length) {
    recommendations.push({ title: "持續監測", detail: "目前無需特別處理，建議持續監測植物與設備狀況。", severity: "healthy" });
  }

  const factorCandidates = [];
  if (noTelemetry) factorCandidates.push("設備無資料");
  else if (telemetryOffline) factorCandidates.push("設備離線");
  if (waterLow) factorCandidates.push("水位不足");
  if (soilDry) factorCandidates.push("土壤過乾");
  if (cameraStatus === "danger") factorCandidates.push("葉面覆蓋率過低");
  else if (cameraStatus === "warning") factorCandidates.push("影像指標需注意");
  if (noCamera || cameraIncomplete) factorCandidates.push("影像資料不足");

  const telemetryDataStatus = {
    state: noTelemetry ? "missing" : telemetryOffline ? "stale" : "normal",
    label: noTelemetry ? "無資料" : telemetryOffline ? "逾時" : "正常",
    detail: noTelemetry
      ? "尚無更新時間"
      : telemetryOffline
        ? `逾時 ${Math.floor((nowTime - telemetryTime) / 60000)} 分鐘`
        : `更新於 ${fmtTime(telemetry.created_at)}`
  };
  const imageDataStatus = {
    state: noCamera || cameraIncomplete ? "missing" : "normal",
    label: noCamera || cameraIncomplete ? "無資料" : "正常",
    detail: latestCamera?.captured_at
      ? `更新於 ${fmtTime(latestCamera.captured_at)}`
      : "尚無更新時間"
  };

  const analysis = {
    score,
    status,
    reasons,
    recommendations,
    leafTrend,
    leafDelta,
    primaryFactors: factorCandidates.slice(0, 2),
    telemetryDataStatus,
    imageDataStatus,
    noTelemetry,
    telemetryOffline,
    noCamera,
    cameraIncomplete,
    cameraStatus,
    soilDry,
    waterLow
  };

  analysis.summary = buildCareSummary(analysis);
  return analysis;
}

function formatAiStatus(status) {
  if (
    status === "healthy" ||
    status === "normal"
  ) {
    return "影像指標正常";
  }

  if (status === "warning") {
    return "影像指標需注意";
  }

  if (status === "danger") {
    return "葉面覆蓋率過低";
  }

  return "尚無法判定";
}

function formatAiStatusClass(status) {
  if (
    status === "healthy" ||
    status === "normal"
  ) {
    return "ok";
  }
  if (status === "warning") return "warn";
  if (status === "danger") return "danger";

  return "info";
}

function formatAiChartTime(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const hour = String(
    date.getHours()
  ).padStart(2, "0");

  const minute = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${month}/${day} ${hour}:${minute}`;
}

/* =========================
   元件
========================= */

const statDevicesEl =
  document.getElementById("statDevices");

const statOnlineEl =
  document.getElementById("statOnline");

const statOfflineEl =
  document.getElementById("statOffline");

const statAlertsEl =
  document.getElementById("statAlerts");

const statDryEl =
  document.getElementById("statDry");

const statNoWaterEl =
  document.getElementById("statNoWater");

const lastRefreshEl =
  document.getElementById("lastRefresh");

const avgSoilNowEl =
    document.getElementById("avgSoilNow");
  
const soilTrendRangeEl =
  document.getElementById("soilTrendRange");

const soilChartEmptyEl =
  document.getElementById("soilChartEmpty");

const soilTrendCanvasEl =
  document.getElementById("soilTrendChart");

let soilTrendChart = null;

const healthPanelEl =
  document.getElementById("healthPanel");

const healthBadgeEl =
  document.getElementById("healthBadge");

const healthTitleEl =
  document.getElementById("healthTitle");

const healthSummaryEl =
  document.getElementById("healthSummary");

const healthSoilEl =
  document.getElementById("healthSoil");

const healthUpdatedEl =
  document.getElementById("healthUpdated");

const soilSignalEl =
  document.getElementById("soilSignal");

const soilSignalValueEl =
  document.getElementById("soilSignalValue");

const soilSignalMetaEl =
  document.getElementById("soilSignalMeta");

const waterSignalEl =
  document.getElementById("waterSignal");

const waterSignalValueEl =
  document.getElementById("waterSignalValue");

const waterSignalMetaEl =
  document.getElementById("waterSignalMeta");

const autoSignalEl =
  document.getElementById("autoSignal");

const autoSignalValueEl =
  document.getElementById("autoSignalValue");

const autoSignalMetaEl =
  document.getElementById("autoSignalMeta");

const connectionSignalEl =
  document.getElementById("connectionSignal");

const connectionSignalValueEl =
  document.getElementById("connectionSignalValue");

const connectionSignalMetaEl =
  document.getElementById("connectionSignalMeta");

/* AI 影像分析 */

const aiMetricTimeEl =
  document.getElementById("aiMetricTime");

const aiLeafCoverEl =
  document.getElementById("aiLeafCover");

const aiRedRatioEl =
  document.getElementById("aiRedRatio");

const aiStatusEl =
  document.getElementById("aiStatus");

const aiMetricNoticeEl =
  document.getElementById("aiMetricNotice");

const aiChartRangeEl =
  document.getElementById("aiChartRange");

const aiChartEmptyEl =
  document.getElementById("aiChartEmpty");

const aiMetricsCanvasEl =
  document.getElementById("aiMetricsChart");

const careScoreEl =
  document.getElementById("careScore");

const careStatusEl =
  document.getElementById("careStatus");

const careStatusHintEl =
  document.getElementById("careStatusHint");

const careAiSummaryEl =
  document.getElementById("careAiSummary");

const careScoreBarEl =
  document.getElementById("careScoreBar");

const carePrimaryFactorsEl =
  document.getElementById("carePrimaryFactors");

const careDataStatusEl =
  document.getElementById("careDataStatus");

const careReasonsEl =
  document.getElementById("careReasons");

const careRecommendationsEl =
  document.getElementById("careRecommendations");

const leafTrendEl =
  document.getElementById("leafTrend");

const leafTrendDeltaEl =
  document.getElementById("leafTrendDelta");

let aiMetricsChart = null;

/* =========================
   狀態 CSS
========================= */

function setStateClass(element, state) {
  if (!element) return;

  element.classList.remove(
    "ok",
    "warn",
    "danger",
    "info",
    "empty"
  );

  if (state) {
    element.classList.add(state);
  }
}

function renderSoilTrendChart(rows, threshold) {
  if (!soilTrendCanvasEl || typeof window.Chart === "undefined") return;

  const labels = rows.map((row) => fmtTime(row.time));
  const values = rows.map((row) => row.value);
  const pointRadius = rows.length > 18 ? 0 : 2.5;
  const thresholdValues = rows.map(() => threshold);

  if (soilChartEmptyEl) soilChartEmptyEl.hidden = Boolean(rows.length);

  const data = {
    labels,
    datasets: [
      {
        label: "土壤濕度",
        data: values,
        borderColor: "#4f8fa3",
        backgroundColor: "rgba(79, 143, 163, 0.12)",
        borderWidth: 2,
        pointRadius,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
        spanGaps: true
      },
      {
        label: "乾燥門檻",
        data: thresholdValues,
        borderColor: "#b4742d",
        borderWidth: 2,
        borderDash: [6, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
        fill: false
      }
    ]
  };

  if (soilTrendChart) {
    soilTrendChart.data = data;
    soilTrendChart.options.plugins.tooltip.callbacks.title = (items) =>
      items[0] ? fmtTime(rows[items[0].dataIndex].time) : "";
    soilTrendChart.update();
    return;
  }

  soilTrendChart = new window.Chart(soilTrendCanvasEl, {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 16 }
        },
        tooltip: {
          callbacks: {
            title: (items) => items[0] ? fmtTime(rows[items[0].dataIndex].time) : "",
            label: (context) => `${context.dataset.label}：${context.parsed.y.toFixed(1)}%`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
        y: {
          min: 0,
          max: 100,
          ticks: { callback: (value) => `${value}%` },
          grid: { color: "rgba(104, 117, 110, 0.14)" }
        }
      }
    }
  });
}

/* =========================
   使用者設備
========================= */

async function getUserDeviceIds() {
  let query = supabase
    .from("user_devices")
    .select("device_id");

  if (appUser.user_id) {
    query = query.eq(
      "user_id",
      appUser.user_id
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "[user_devices] load failed:",
      error
    );

    return [];
  }

  return (data || [])
    .map((row) => row.device_id)
    .filter(Boolean);
}

/* =========================
   AI 影像分析資料
========================= */

async function loadCameraMetrics(deviceId) {
  const limit = Math.max(
    1,
    Number(
      aiChartRangeEl?.value || 48
    )
  );

  const { data, error } = await supabase
    .from("camera_metrics")
    .select(`
      captured_at,
      leaf_cover,
      red_ratio,
      status
    `)
    .eq("device_id", deviceId)
    .order("captured_at", {
      ascending: false
    })
    .limit(limit);

  if (error) {
    console.error(
      "[camera_metrics] load failed:",
      error
    );

    renderCameraMetrics([]);
    return [];
  }

  const rows = [
    ...(data || [])
  ].reverse();

  renderCameraMetrics(rows);
  return rows;
}

function renderCareList(element, items) {
  if (!element) return;

  element.replaceChildren(
    ...items.map((item) => {
      const row = document.createElement("div");
      const marker = document.createElement("i");
      const copy = document.createElement("span");
      const title = document.createElement("b");
      const detail = document.createElement("small");
      row.className = `care-list-row ${item.severity || "info"}`;
      marker.setAttribute("aria-hidden", "true");
      title.textContent = item.title;
      detail.textContent = item.detail;
      copy.append(title, detail);
      row.append(marker, copy);
      return row;
    })
  );
}

function renderDataStatusRow(label, status) {
  const row = document.createElement("div");
  const icon = document.createElement("i");
  const name = document.createElement("span");
  const value = document.createElement("span");
  const badge = document.createElement("b");
  const detail = document.createElement("small");
  row.className = "care-data-row";
  icon.className = `care-data-icon ${label === "設備資料" ? "device" : "image"}`;
  icon.setAttribute("aria-hidden", "true");
  name.textContent = label;
  badge.className = status.state;
  badge.textContent = status.label;
  detail.textContent = status.detail;
  value.append(badge, detail);
  row.append(icon, name, value);
  return row;
}

function renderCareAnalysis(analysis) {
  if (!analysis) return;

  if (careScoreEl) {
    if (analysis.score === null) {
      careScoreEl.textContent = "—";
    } else {
      const unit = document.createElement("em");
      unit.textContent = "分";
      careScoreEl.replaceChildren(String(analysis.score), unit);
    }

    careScoreEl.parentElement.dataset.tone = analysis.score === null
      ? "unknown"
      : analysis.score < 50
        ? "danger"
        : analysis.score < 80
          ? "warning"
          : "healthy";
  }

  if (careScoreBarEl) {
    careScoreBarEl.style.width = analysis.score === null
      ? "0%"
      : `${Math.min(100, Math.max(0, analysis.score))}%`;
    careScoreBarEl.parentElement.hidden = analysis.score === null;
  }

  if (careAiSummaryEl) {
    careAiSummaryEl.textContent = analysis.summary;
  }

  if (careStatusEl) {
    careStatusEl.className = analysis.status || "unknown";
    const dot = document.createElement("i");
    dot.setAttribute("aria-hidden", "true");
    careStatusEl.replaceChildren(
      dot,
      CARE_STATUS_LABELS[analysis.status] || CARE_STATUS_LABELS.unknown
    );
  }

  if (careStatusHintEl) {
    const statusHints = {
      unknown: "資料不足，無法完整評估",
      danger: "目前有需要立即處理的項目",
      warning: "目前有需要持續注意的項目",
      healthy: "目前未發現主要異常"
    };
    careStatusHintEl.textContent = statusHints[analysis.status] || statusHints.unknown;
  }

  if (carePrimaryFactorsEl) {
    const factors = analysis.primaryFactors.length
      ? analysis.primaryFactors
      : ["目前無主要異常因素"];
    carePrimaryFactorsEl.replaceChildren(
      ...factors.map((factor) => {
        const item = document.createElement("span");
        if (factor.includes("離線") || factor.includes("無資料") || factor.includes("水位不足")) {
          item.className = "danger";
        } else if (factor.includes("過乾") || factor.includes("注意")) {
          item.className = "warning";
        } else if (factor.includes("不足")) {
          item.className = "info";
        } else {
          item.className = "healthy";
        }
        item.textContent = factor;
        return item;
      })
    );
  }

  if (careDataStatusEl) {
    careDataStatusEl.replaceChildren(
      renderDataStatusRow("設備資料", analysis.telemetryDataStatus),
      renderDataStatusRow("影像資料", analysis.imageDataStatus)
    );
  }

  renderCareList(careReasonsEl, analysis.reasons);
  renderCareList(careRecommendationsEl, analysis.recommendations);

  const trendLabels = {
    insufficient: "資料不足",
    up: "上升",
    down: "下降",
    stable: "穩定"
  };

  if (leafTrendEl) {
    leafTrendEl.textContent =
      trendLabels[analysis.leafTrend] || trendLabels.insufficient;
    leafTrendEl.className = `leaf-trend-${analysis.leafTrend}`;
  }

  if (leafTrendDeltaEl) {
    if (analysis.leafDelta === null) {
      leafTrendDeltaEl.textContent = "少於兩筆有效資料";
    } else if (analysis.leafTrend === "up") {
      leafTrendDeltaEl.textContent =
        `較上次增加 ${Math.abs(analysis.leafDelta).toFixed(1)}%`;
    } else if (analysis.leafTrend === "down") {
      leafTrendDeltaEl.textContent =
        `較上次減少 ${Math.abs(analysis.leafDelta).toFixed(1)}%`;
    } else {
      leafTrendDeltaEl.textContent = "與上次相比穩定";
    }
  }
}

function renderCameraMetrics(rows) {
  if (
    !aiLeafCoverEl ||
    !aiRedRatioEl ||
    !aiStatusEl ||
    !aiMetricTimeEl ||
    !aiMetricNoticeEl
  ) {
    return;
  }

  aiStatusEl.classList.remove(
    "ok",
    "warn",
    "danger",
    "info"
  );

  if (!rows.length) {
    aiLeafCoverEl.textContent = "—";
    aiRedRatioEl.textContent = "—";
    aiStatusEl.textContent = "—";
    aiMetricTimeEl.textContent = "—";

    aiMetricNoticeEl.textContent =
      "尚無影像分析資料";

    aiStatusEl.classList.add("info");

    if (aiChartEmptyEl) {
      aiChartEmptyEl.hidden = false;
    }

    if (aiMetricsChart) {
      aiMetricsChart.destroy();
      aiMetricsChart = null;
    }

    return;
  }

  const latest =
    rows[rows.length - 1];

  const leaf =
    safeNum(latest.leaf_cover);

  const red =
    safeNum(latest.red_ratio);

  const status =
    latest.status || "unknown";

  aiLeafCoverEl.textContent =
    leaf === null
      ? "—"
      : `${leaf.toFixed(1)}%`;

  aiRedRatioEl.textContent =
    red === null
      ? "—"
      : `${red.toFixed(1)}%`;

  aiStatusEl.textContent =
    formatAiStatus(status);

  aiStatusEl.classList.add(
    formatAiStatusClass(status)
  );

  aiMetricTimeEl.textContent =
    fmtTime(latest.captured_at);

  if (
    status === "healthy" ||
    status === "normal"
  ) {
    aiMetricNoticeEl.textContent =
      `目前顯示最近 ${rows.length} 筆資料，影像指標目前穩定。`;
  } else if (status === "warning") {
    aiMetricNoticeEl.textContent =
      `目前顯示最近 ${rows.length} 筆資料，葉面覆蓋率偏低，建議持續觀察。`;
  } else if (status === "danger") {
    aiMetricNoticeEl.textContent =
      `目前顯示最近 ${rows.length} 筆資料，葉面覆蓋率過低，建議檢查植物與拍攝環境。`;
  } else {
    aiMetricNoticeEl.textContent =
      `目前顯示最近 ${rows.length} 筆影像分析資料。`;
  }

  if (aiChartEmptyEl) {
    aiChartEmptyEl.hidden = true;
  }

  renderAiMetricsChart(rows);
}

function renderAiMetricsChart(rows) {
  if (!aiMetricsCanvasEl) return;

  if (
    typeof window.Chart === "undefined"
  ) {
    console.error(
      "Chart.js 尚未載入"
    );

    return;
  }

  const labels = rows.map((row) =>
    formatAiChartTime(
      row.captured_at
    )
  );

  const leafValues = rows.map((row) =>
    safeNum(row.leaf_cover)
  );

  const redValues = rows.map((row) =>
    safeNum(row.red_ratio)
  );

  if (aiMetricsChart) {
    aiMetricsChart.data.labels =
      labels;

    aiMetricsChart.data.datasets[0].data =
      leafValues;

    aiMetricsChart.data.datasets[1].data =
      redValues;

    aiMetricsChart.data.datasets[0].pointRadius =
      rows.length > 48 ? 0 : 2.5;

    aiMetricsChart.data.datasets[1].pointRadius =
      rows.length > 48 ? 0 : 2.5;

    aiMetricsChart.update();

    return;
  }

  aiMetricsChart = new window.Chart(
    aiMetricsCanvasEl,
    {
      type: "line",

      data: {
        labels,

        datasets: [
          {
            label: "葉面覆蓋率",
            data: leafValues,
            borderColor: "#16a34a",
            backgroundColor:
              "rgba(22, 163, 74, 0.12)",
            borderWidth: 2,
            pointRadius:
              rows.length > 48
                ? 0
                : 2.5,
            pointHoverRadius: 5,
            tension: 0.3,
            fill: false,
            spanGaps: true
          },
          {
            label: "紅色區域比例",
            data: redValues,
            borderColor: "#ef4444",
            backgroundColor:
              "rgba(239, 68, 68, 0.12)",
            borderWidth: 2,
            pointRadius:
              rows.length > 48
                ? 0
                : 2.5,
            pointHoverRadius: 5,
            tension: 0.3,
            fill: false,
            spanGaps: true
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: "index",
          intersect: false
        },

        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",

            labels: {
              usePointStyle: true,
              boxWidth: 8,
              boxHeight: 8,
              padding: 16
            }
          },

          tooltip: {
            callbacks: {
              title(items) {
                const index =
                  items[0]?.dataIndex;

                if (
                  index === undefined
                ) {
                  return "";
                }

                return fmtTime(
                  rows[index].captured_at
                );
              },

              label(context) {
                const value =
                  context.parsed.y;

                const text =
                  value === null
                    ? "—"
                    : value.toFixed(2);

                return `${context.dataset.label}：${text}%`;
              }
            }
          }
        },

        scales: {
          x: {
            grid: {
              display: false
            },

            ticks: {
              maxTicksLimit: 8,
              maxRotation: 0,
              autoSkip: true
            },

            title: {
              display: true,
              text: "分析時間"
            }
          },

          y: {
            beginAtZero: true,
            max: 100,

            ticks: {
              callback(value) {
                return `${value}%`;
              }
            },

            title: {
              display: true,
              text: "比例"
            }
          }
        }
      }
    }
  );
}

/* =========================
   控制台連結
========================= */

sideNav
  .querySelectorAll("a")
  .forEach((link) => {
    if (
      link.getAttribute("href") ===
      "control.html"
    ) {
      link.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();

          const deviceIds =
            await getUserDeviceIds();

          if (!deviceIds.length) {
            alert(
              "尚未綁定任何設備（user_devices 無資料）"
            );

            return;
          }

          location.href =
            `control.html?device_id=${encodeURIComponent(
              deviceIds[0]
            )}`;
        }
      );
    }
  });

/* =========================
   健康狀態
========================= */

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
}) {
  const updatedText =
    fmtTime(new Date());

  if (healthUpdatedEl) {
    healthUpdatedEl.textContent =
      updatedText;
  }

  if (lastRefreshEl) {
    lastRefreshEl.textContent =
      updatedText;
  }

  if (!total) {
    setStateClass(
      healthPanelEl,
      "empty"
    );

    if (healthBadgeEl) {
      healthBadgeEl.textContent =
        "尚未綁定";
    }

    if (healthTitleEl) {
      healthTitleEl.textContent =
        "尚未綁定任何設備";
    }

    if (healthSummaryEl) {
      healthSummaryEl.textContent =
        "請先綁定設備，系統才會顯示植物健康與澆水狀態。";
    }

    if (healthSoilEl) {
      healthSoilEl.textContent = "—";
    }

    setStateClass(
      soilSignalEl,
      "info"
    );

    setStateClass(
      waterSignalEl,
      "info"
    );

    setStateClass(
      autoSignalEl,
      "info"
    );

    setStateClass(
      connectionSignalEl,
      "info"
    );

    if (soilSignalValueEl) {
      soilSignalValueEl.textContent =
        "—";
    }

    if (soilSignalMetaEl) {
      soilSignalMetaEl.textContent =
        "尚無設備資料";
    }

    if (waterSignalValueEl) {
      waterSignalValueEl.textContent =
        "—";
    }

    if (waterSignalMetaEl) {
      waterSignalMetaEl.textContent =
        "尚無設備資料";
    }

    if (autoSignalValueEl) {
      autoSignalValueEl.textContent =
        "—";
    }

    if (autoSignalMetaEl) {
      autoSignalMetaEl.textContent =
        "尚無設備資料";
    }

    if (connectionSignalValueEl) {
      connectionSignalValueEl.textContent =
        "0 / 0";
    }

    if (connectionSignalMetaEl) {
      connectionSignalMetaEl.textContent =
        "尚無設備資料";
    }

    return;
  }

  const needsAction =
    offline > 0 ||
    nowater > 0;

  const needsAttention =
    !needsAction &&
    dry > 0;

  const healthState =
    needsAction
      ? "danger"
      : needsAttention
        ? "warn"
        : "ok";

  setStateClass(
    healthPanelEl,
    healthState
  );

  if (healthBadgeEl) {
    healthBadgeEl.textContent =
      healthState === "ok"
        ? "健康"
        : healthState === "warn"
          ? "注意"
          : "需要處理";
  }

  if (healthTitleEl) {
    healthTitleEl.textContent =
      healthState === "ok"
        ? "植物狀態穩定"
        : healthState === "warn"
          ? "部分植物需要留意"
          : "有設備需要立即處理";
  }

  if (healthSummaryEl) {
    const parts = [
      `${online}/${total} 台設備在線`,
      nowater
        ? `${nowater} 台水位不足`
        : "水位正常",
      dry
        ? `${dry} 台土壤偏乾`
        : "濕度正常"
    ];

    healthSummaryEl.textContent =
      parts.join("，") + "。";
  }

  if (healthSoilEl) {
    healthSoilEl.textContent =
      avg === null
        ? "—"
        : `${avg.toFixed(1)}%`;
  }

  const soilState =
    avg === null
      ? "info"
      : avg < avgThreshold
        ? "warn"
        : "ok";

  setStateClass(
    soilSignalEl,
    soilState
  );

  if (soilSignalValueEl) {
    soilSignalValueEl.textContent =
      avg === null
        ? "—"
        : `${avg.toFixed(1)}%`;
  }

  if (soilSignalMetaEl) {
    soilSignalMetaEl.textContent =
      avg === null
        ? "尚無濕度資料"
        : `平均門檻 ${avgThreshold.toFixed(0)}%`;
  }

  const waterState =
    !waterKnown
      ? "info"
      : nowater > 0
        ? "danger"
        : "ok";

  setStateClass(
    waterSignalEl,
    waterState
  );

  if (waterSignalValueEl) {
    waterSignalValueEl.textContent =
      !waterKnown
        ? "—"
        : nowater > 0
          ? `${nowater} 台缺水`
          : "水位正常";
  }

  if (waterSignalMetaEl) {
    waterSignalMetaEl.textContent =
      waterKnown
        ? `${waterOk} 台有水 / ${nowater} 台缺水`
        : "尚無水位資料";
  }

  const autoState =
    !autoKnown
      ? "info"
      : "ok";

  setStateClass(
    autoSignalEl,
    autoState
  );

  if (autoSignalValueEl) {
    autoSignalValueEl.textContent =
      !autoKnown
        ? "—"
        : `${autoOn} 台自動`;
  }

  if (autoSignalMetaEl) {
    autoSignalMetaEl.textContent =
      autoKnown
        ? `${autoKnown - autoOn} 台手動 / ${total - autoKnown} 台未回報`
        : "尚無模式資料";
  }

  const connectionState =
    offline > 0
      ? "danger"
      : "ok";

  setStateClass(
    connectionSignalEl,
    connectionState
  );

  if (connectionSignalValueEl) {
    connectionSignalValueEl.textContent =
      `${online} / ${total}`;
  }

  if (connectionSignalMetaEl) {
    connectionSignalMetaEl.textContent =
      offline > 0
        ? `${offline} 台超過 15 分鐘未回傳`
        : "所有設備最近有回傳";
  }
}

/* =========================
   載入儀表板
========================= */

async function loadDashboard() {
  const deviceIds =
    await getUserDeviceIds();

  statDevicesEl.textContent =
    deviceIds.length;

  if (!deviceIds.length) {
  renderCameraMetrics([]);
  renderCareAnalysis(buildCareAnalysis({
    telemetry: null,
    cameraMetrics: [],
    moistOn: 30,
    now: new Date()
  }));

  if (soilTrendRangeEl) {
    soilTrendRangeEl.textContent = "尚無資料";
  }

  if (soilChartEmptyEl) {
    soilChartEmptyEl.textContent = "尚無土壤濕度資料";
  }

    statOnlineEl.textContent = 0;
    statOfflineEl.textContent = 0;
    statAlertsEl.textContent = 0;
    statDryEl.textContent = 0;
    statNoWaterEl.textContent = 0;

    renderSoilTrendChart([], 30);

    avgSoilNowEl.textContent = "—";

    updateHealthOverview({
      total: 0,
      online: 0,
      offline: 0,
      alerts: 0,
      dry: 0,
      nowater: 0,
      avg: null,
      avgThreshold: 30,
      autoOn: 0,
      autoKnown: 0,
      waterOk: 0,
      waterKnown: 0
    });

    return;
  }

  const cameraMetrics = await loadCameraMetrics(
    deviceIds[0]
  );

  const {
    data: cfgRows,
    error: cfgError
  } = await supabase
    .from("device_cfg")
    .select("device_id, moist_on")
    .in("device_id", deviceIds);

  if (cfgError) {
    console.error(
      "[device_cfg] load failed:",
      cfgError
    );
  }

  const moistOnMap = {};

  (cfgRows || []).forEach((row) => {
    const value =
      safeNum(row.moist_on);

    if (
      row.device_id &&
      value !== null
    ) {
      moistOnMap[row.device_id] =
        value;
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
  let primaryTelemetry = null;

  for (const deviceId of deviceIds) {
    const {
      data: telemetryRows,
      error: telemetryError
    } = await supabase
      .from("telemetry")
      .select(`
        soil,
        tank,
        pump,
        auto,
        vbat,
        created_at
      `)
      .eq("device_id", deviceId)
      .order("created_at", {
        ascending: false
      })
      .limit(1);

    if (telemetryError) {
      console.error(
        "[telemetry] load failed:",
        telemetryError
      );
    }

    const row =
      telemetryRows &&
      telemetryRows[0]
        ? telemetryRows[0]
        : null;

    if (deviceId === deviceIds[0]) {
      primaryTelemetry = row;
    }

    const timestamp =
      row?.created_at || null;

    const mins =
      minutesAgo(timestamp);

    const isOnline =
      mins < 15;

    if (isOnline) {
      online++;
    } else {
      offline++;
    }

    const soil =
        safeSoilNum(row?.soil);

    if (soil !== null) {
      soilsForAvg.push(soil);
    }

    const tank =
      row?.tank;

    const moistOn =
      moistOnMap[deviceId] ?? 30;

    if (tank === true) {
      waterOk++;
      waterKnown++;
    }

    if (tank === false) {
      waterKnown++;
    }

    if (row?.auto === true) {
      autoOn++;
      autoKnown++;
    }

    if (row?.auto === false) {
      autoKnown++;
    }

    const isDry =
      soil !== null
        ? soil < moistOn
        : false;

    const isNoWater =
      tank === false;

    const isOffline =
      !isOnline;

    const types = [];

    if (isDry) {
      types.push("過乾");
    }

    if (isNoWater) {
      types.push("缺水");
    }

    if (isOffline) {
      types.push("離線");
    }

    const isAlert =
      types.length > 0;

    if (isDry) {
      dry++;
    }

    if (isNoWater) {
      nowater++;
    }

    if (isAlert) {
      alerts++;
    }

    if (isAlert) {
      const badgeClass =
        isOffline || isNoWater
          ? "danger"
          : "warn";

      const summary = [
        `濕度：${
          soil === null
            ? "—"
            : `${soil}%`
        }（門檻 ${moistOn}%）`,

        `水位：${
          tank === null ||
          tank === undefined
            ? "—"
            : tank
              ? "有水"
              : "缺水"
        }`,

        `模式：${
          row?.auto === null ||
          row?.auto === undefined
            ? "—"
            : row.auto
              ? "自動"
              : "手動"
        }`,

        `水泵：${
          row?.pump
            ? "運轉中"
            : "停止"
        }`
      ].join(" · ");

      alertRows.push({
        device_id: deviceId,
        types,
        summary,
        timestamp,
        badgeClass
      });
    }
  }

  statOnlineEl.textContent =
    online;

  statOfflineEl.textContent =
    offline;

  statAlertsEl.textContent =
    alerts;

  statDryEl.textContent =
    dry;

  statNoWaterEl.textContent =
    nowater;

  const avg =
    soilsForAvg.length
      ? soilsForAvg.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / soilsForAvg.length
      : null;

  const avgThreshold =
    deviceIds.length
      ? deviceIds.reduce(
          (sum, deviceId) =>
            sum +
            (
              moistOnMap[deviceId] ??
              30
            ),
          0
        ) / deviceIds.length
      : 30;

  avgSoilNowEl.textContent =
    avg === null
      ? "—"
      : `${avg.toFixed(1)}%`;

  updateHealthOverview({
    total: deviceIds.length,
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

  renderCareAnalysis(buildCareAnalysis({
    telemetry: primaryTelemetry,
    cameraMetrics,
    moistOn: moistOnMap[deviceIds[0]] ?? 30,
    now: new Date()
  }));

    /* =========================
   土壤濕度趨勢
   優先近 1 小時，無資料改抓最近 24 筆
========================= */

const since = new Date(
  Date.now() - 60 * 60 * 1000
).toISOString();

let trendMode = "hour";

let {
  data: trendRows,
  error: trendError
} = await supabase
  .from("telemetry")
  .select(`
    device_id,
    soil,
    created_at
  `)
  .in("device_id", deviceIds)
  .gte("created_at", since)
  .order("created_at", {
    ascending: true
  })
  .limit(800);

if (trendError) {
  console.error(
    "[telemetry trend] recent hour load failed:",
    trendError
  );

  trendRows = [];
}

/* 過濾空值與非數字 */
let validTrendRows = (trendRows || [])
  .map((row) => ({
    ...row,
    soilNumber: safeSoilNum(row.soil)
  }))
  .filter((row) =>
    row.soilNumber !== null &&
    row.created_at
  );

/* 近一小時沒有資料，改抓最近 24 筆 */
if (!validTrendRows.length) {
  trendMode = "latest";

  const {
  data: latestRows,
  error: latestError
} = await supabase
  .from("telemetry")
  .select(`
    device_id,
    soil,
    created_at
  `)
  .in("device_id", deviceIds)
  .not("soil", "is", null)
  .order("created_at", {
    ascending: false
  })
  .limit(24);

  if (latestError) {
    console.error(
      "[telemetry trend] latest rows load failed:",
      latestError
    );

    validTrendRows = [];
  } else {
    validTrendRows = (latestRows || [])
      .map((row) => ({
        ...row,
        soilNumber: safeSoilNum(row.soil)
      }))
      .filter((row) =>
        row.soilNumber !== null &&
        row.created_at
      )
      .reverse();
  }
}

let soilTrendRows = [];

if (trendMode === "hour") {
  /*
   * 近一小時資料：
   * 每 5 分鐘整理成一個平均值
   */
  const buckets = new Map();

  validTrendRows.forEach((row) => {
    const timestamp =
      new Date(row.created_at).getTime();

    if (!Number.isFinite(timestamp)) {
      return;
    }

    const bucketKey =
      Math.floor(
        timestamp / (5 * 60 * 1000)
      ) * (5 * 60 * 1000);

    const bucket =
      buckets.get(bucketKey) || {
        sum: 0,
        count: 0
      };

    bucket.sum += row.soilNumber;
    bucket.count += 1;

    buckets.set(bucketKey, bucket);
  });

  const keys = Array
    .from(buckets.keys())
    .sort((a, b) => a - b);

  if (keys.length) {
    const start = keys[0];
    const end = keys[keys.length - 1];

    for (
      let key = start;
      key <= end;
      key += 5 * 60 * 1000
    ) {
      const bucket = buckets.get(key);

      soilTrendRows.push({
        time: new Date(key).toISOString(),
        value: bucket ? bucket.sum / bucket.count : null
      });
    }
  }
} else {
  /*
   * 備援資料：
   * 直接畫最近 24 筆
   */
  soilTrendRows = validTrendRows.map((row) => ({
    time: row.created_at,
    value: row.soilNumber
  }));
}

renderSoilTrendChart(soilTrendRows, avgThreshold);

/* 更新圖表顯示範圍文字 */
if (soilTrendRangeEl) {
  if (!soilTrendRows.length) {
    soilTrendRangeEl.textContent = "尚無資料";
  } else if (trendMode === "hour") {
    soilTrendRangeEl.textContent = "近 1 小時";
  } else {
    soilTrendRangeEl.textContent =
      `最近 ${soilTrendRows.length} 筆`;
  }
}

/* 更新空資料提示 */
if (soilChartEmptyEl) {
  soilChartEmptyEl.textContent =
    soilTrendRows.length
      ? ""
      : "尚無土壤濕度資料";
}

  if (healthUpdatedEl) {
    healthUpdatedEl.textContent =
      fmtTime(new Date());
  }
}

/* =========================
   AI 圖表範圍切換
========================= */

if (aiChartRangeEl) {
    aiChartRangeEl.addEventListener(
    "change",
    async () => {
      const deviceIds =
        await getUserDeviceIds();

        if (!deviceIds.length) {
            renderCameraMetrics([]);
            return;
            }

      await loadCameraMetrics(
        deviceIds[0]
      );
    }
  );
}

/* =========================
   初始化
========================= */

loadDashboard();

setInterval(
  loadDashboard,
  10000
);
