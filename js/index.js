import { requireLogin, isAdmin, logout } from "../auth.js";
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
    icon: "總",
    text: "儀表板"
  },
  {
    href: "control.html",
    icon: "控",
    text: "控制台"
  },
  {
    href: "history.html",
    icon: "歷",
    text: "歷史資料"
  },
  {
    href: "change_password.html",
    icon: "密",
    text: "修改密碼"
  }
];

if (isAdmin(appUser)) {
  navItems.push({
    href: "user.html",
    icon: "人",
    text: "使用者管理"
  });
}

sideNav.innerHTML = navItems
  .map((item) => {
    const active = item.href === "index.html";

    return `
      <a class="${active ? "active" : ""}" href="${item.href}">
        <span class="ico">${item.icon}</span>
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

const alertsBodyEl =
  document.getElementById("alertsBody");

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

const alertsNowEl =
  document.getElementById("alertsNow");

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
    return;
  }

  const rows = [
    ...(data || [])
  ].reverse();

  renderCameraMetrics(rows);
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

    alertsBodyEl.innerHTML = `
      <tr>
        <td colspan="5" class="muted">
          尚未綁定任何設備（user_devices 無資料）
        </td>
      </tr>
    `;

    renderSoilTrendChart([], 30);

    avgSoilNowEl.textContent = "—";
    alertsNowEl.textContent = "—";

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

  await loadCameraMetrics(
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

  if (!alertRows.length) {
    alertsBodyEl.innerHTML = `
      <tr>
        <td colspan="5" class="muted">
          目前沒有告警（全部正常）
        </td>
      </tr>
    `;
  } else {
    alertRows.sort((a, b) => {
      const score = (row) =>
        (
          row.types.includes("離線")
            ? 100
            : 0
        ) +
        (
          row.types.includes("缺水")
            ? 50
            : 0
        ) +
        (
          row.types.includes("過乾")
            ? 10
            : 0
        );

      return score(b) - score(a);
    });

    alertsBodyEl.innerHTML =
      alertRows
        .map((row) => {
          const typeText =
            row.types.join("、");

          const badgeText =
            row.badgeClass === "danger"
              ? "嚴重"
              : "注意";

          return `
            <tr>
              <td data-label="設備">
                <b>${row.device_id}</b>
              </td>

              <td data-label="狀態">
                <span class="badge ${row.badgeClass}">
                  ${badgeText} · ${typeText}
                </span>
              </td>

              <td data-label="摘要" class="muted">
                ${row.summary}
              </td>

              <td data-label="最後回傳" class="muted">
                ${fmtTime(row.timestamp)}
              </td>

              <td data-label="操作">
                <button
                  class="btn primary"
                  data-go="${row.device_id}"
                  type="button"
                >
                  前往控制台
                </button>
              </td>
            </tr>
          `;
        })
        .join("");

    alertsBodyEl
      .querySelectorAll("[data-go]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const deviceId =
              button.getAttribute(
                "data-go"
              );

            location.href =
              `control.html?device_id=${encodeURIComponent(
                deviceId
              )}`;
          }
        );
      });
  }

  avgSoilNowEl.textContent =
    avg === null
      ? "—"
      : `${avg.toFixed(1)}%`;

  alertsNowEl.textContent =
    `${alerts} 台`;

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
