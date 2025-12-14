const telegram = window.Telegram.WebApp;
const DEVICE_TYPE = telegram.platform;

telegram.expand();
if (telegram.isVersionAtLeast("7.7")) telegram.disableVerticalSwipes();
if (telegram.isVersionAtLeast("8.0")) {
  telegram.requestFullscreen();
}


function hapticFeedback(type, redirectUrl) {
  if (telegram.isVersionAtLeast("6.1") && (DEVICE_TYPE === 'android' || DEVICE_TYPE === 'ios')) {
    switch (type) {
      case 'light':
        telegram.HapticFeedback.impactOccurred('light');
        break;
      case 'medium':
        telegram.HapticFeedback.impactOccurred('medium');
        break;
      case 'heavy':
        telegram.HapticFeedback.impactOccurred('heavy');
        break;
      case 'rigid':
        telegram.HapticFeedback.impactOccurred('rigid');
        break;
      case 'soft':
        telegram.HapticFeedback.impactOccurred('soft');
        break;
      case 'error':
        telegram.HapticFeedback.notificationOccurred('error');
        break;
      case 'success':
        telegram.HapticFeedback.notificationOccurred('success');
        break;
      case 'warning':
        telegram.HapticFeedback.notificationOccurred('warning');
        break;
      case 'change':
        telegram.HapticFeedback.selectionChanged();
        break;
      default:
        console.warn('Unknown haptic feedback type:', type);
    }
  }
  if (redirectUrl && redirectUrl !== '#') {
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 0);
  }
}




const SafeAreaManager = (() => {
  let safeAreaTop = 0;
  let safeAreaBottom = 0;
  let contentSafeAreaTop = 0;
  let contentSafeAreaBottom = 0;

  function getTotalSafeAreas() {
    return {
      top: safeAreaTop + contentSafeAreaTop,
      bottom: safeAreaBottom + contentSafeAreaBottom
    };
  }

  function getIndividualSafeAreas() {
    return {
      safeAreaTop,
      safeAreaBottom,
      contentSafeAreaTop,
      contentSafeAreaBottom
    };
  }

  function updateFromTelegram() {
    const content = telegram.contentSafeAreaInset || {};
    const system = telegram.safeAreaInset || {};

    contentSafeAreaTop = content.top || 0;
    contentSafeAreaBottom = content.bottom || 0;
    safeAreaTop = system.top || 0;
    safeAreaBottom = system.bottom || 0;
  }

  function init() {
    const updateAndNotify = () => {
      updateFromTelegram();
      if (typeof SafeAreaManager.onChange === 'function') {
        // Передаем и сумму, и отдельные значения
        SafeAreaManager.onChange({
          total: getTotalSafeAreas(),
          individual: getIndividualSafeAreas()
        });
      }
    };

    telegram.onEvent('safeAreaChanged', updateAndNotify);
    telegram.onEvent('contentSafeAreaChanged', updateAndNotify);
    updateAndNotify();
  }

  return {
    init,
    getTotalSafeAreas,
    getIndividualSafeAreas,
    onChange: null
  };
})();






document.addEventListener('DOMContentLoaded', () => {
  const next = document.querySelector('.next');
  const content = document.getElementById('content');

  SafeAreaManager.onChange = ({ total, individual }) => {
    const { top, bottom } = total;
    const { safeAreaTop, contentSafeAreaTop } = individual;

    const bottomValue = bottom === 0 ? 'calc((100 / 428) * 8 * var(--vw))' : `${bottom}px`;
    const topValue = top === 0 ? 'calc(100 / 428 * 8 * var(--vw))' : `${top}px`;

    content.style.marginTop = top === 0 ? 'calc(100 / 428 * (48 + 8 + 126) * var(--vw))' : `calc(100 / 428 * (48 + 126) * var(--vw) + ${top}px)`;
    content.style.paddingBottom = bottom === 0 ? 'calc((100 / 428) * 48 * var(--vw))' : `${bottom * 2}px`;

    if (top === 0) next.style.paddingTop = "0px";
    else {
      next.style.paddingTop = `calc(${(contentSafeAreaTop - safeAreaTop) / 2 + safeAreaTop}px - (100 / 428 * (22.5 / 2 - 6) * var(--vw)))`;
    }


  };
  SafeAreaManager.init();
});













function showGrandPrixInfo(el) {
  const info = el.closest('.card').nextElementSibling;
  info.classList.toggle('open');
  const showGrandPrixInfo = el.querySelector('.show-grand-prix-info svg');
  showGrandPrixInfo.classList.toggle('open');
}











const USER_GMT = -new Date().getTimezoneOffset() / 60;

const MONTHS_SHORT = [
  "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЯ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"
];

const WEEKDAYS = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    const content = document.getElementById("content");
    content.innerHTML = "";

    let prevRaceUnix = null;

    Object.entries(data).forEach(([key, gp]) => {

      // ---------- ПЕРЕРЫВ МЕЖДУ ГОНКАМИ ----------
      const firstSessionUnix = gp.schedule["1"];

      if (prevRaceUnix !== null) {
        const diffSeconds = firstSessionUnix - prevRaceUnix;
        const diffWeeks = Math.round(diffSeconds / (7 * 24 * 3600));

        const waiting = document.createElement("div");
        waiting.className = "waiting";
        waiting.innerHTML = `
        <span>${diffWeeks} НЕД</span>
        <svg><use href="#waiting-svg"></use></svg>
    `;

        content.appendChild(waiting);
      }


      const isSprint = gp.sprint_num !== null;

      // ---------- ДАТЫ ----------
      const scheduleDates = Object.values(gp.schedule).map(ts =>
        toUserDate(ts, USER_GMT)
      );

      const firstDate = scheduleDates[0];
      const lastDate = scheduleDates[4];

      let dateRangeText;
      if (firstDate.month === lastDate.month) {
        dateRangeText = `${firstDate.day} - ${lastDate.day} ${MONTHS_SHORT[firstDate.month]}`;
      } else {
        dateRangeText = `${firstDate.day} ${MONTHS_SHORT[firstDate.month]} - ${lastDate.day} ${MONTHS_SHORT[lastDate.month]}`;
      }

      // ---------- GRAND PRIX ----------
      const grandPrix = document.createElement("div");
      grandPrix.className = "grand-prix" + (isSprint ? " sprint" : "");

      grandPrix.innerHTML = `
                <div class="card" onclick="showGrandPrixInfo(this); hapticFeedback('soft')">
                    <div class="num">
                        <span>${key}</span>
                        ${isSprint ? `<span class="sprint-num">${gp.sprint_num}</span>` : ""}
                    </div>
                    <div class="flag">
                        <img src="flags/${gp.svg}.svg" alt="flag">
                    </div>
                    <div class="country-date">
                        <span>${gp.name.ru}</span>
                        <span>${dateRangeText}</span>
                    </div>
                    <div class="show-grand-prix-info">
                        <svg> <use href="#show-grand-prix-info-svg"></use></svg>
                    </div>
                </div>
                <div class="info">
                    <div class="schedule"></div>
                </div>
            `;

      const scheduleContainer = grandPrix.querySelector(".schedule");

      // ---------- ГРУППИРОВКА ПО ДНЯМ ----------
      const daysMap = {};

      scheduleDates.forEach((d, i) => {
        const key = `${d.year}-${d.month}-${d.day}`;
        if (!daysMap[key]) daysMap[key] = [];
        daysMap[key].push({ index: i + 1, date: d });
      });

      // ---------- НАЗВАНИЯ СЕССИЙ ----------
      const normalNames = [
        "1-Я ПРАКТИКА",
        "2-Я ПРАКТИКА",
        "3-Я ПРАКТИКА",
        "КВАЛИФИКАЦИЯ",
        "ГОНКА"
      ];

      const sprintNames = [
        "1-Я ПРАКТИКА",
        "СПРИНТ-КВАЛИФИКАЦИЯ",
        "СПРИНТ",
        "КВАЛИФИКАЦИЯ",
        "ГОНКА"
      ];

      const raceNames = isSprint ? sprintNames : normalNames;

      // ---------- СОЗДАНИЕ ДНЕЙ ----------
      Object.values(daysMap).forEach(dayEvents => {
        const d = dayEvents[0].date;

        const dayEl = document.createElement("div");
        dayEl.className = "day";

        dayEl.innerHTML = `
                    <span class="date">
                        ${d.day} ${MONTHS_SHORT[d.month]} (${WEEKDAYS[d.weekday]})
                    </span>
                    <div class="races"></div>
                `;

        const racesEl = dayEl.querySelector(".races");

        dayEvents.forEach(ev => {
          const raceEl = document.createElement("div");
          raceEl.className = "race";
          raceEl.innerHTML = `
                        <span>${raceNames[ev.index - 1]}</span>
                        <span>${ev.date.time}</span>
                    `;
          racesEl.appendChild(raceEl);
        });

        scheduleContainer.appendChild(dayEl);
      });

      content.appendChild(grandPrix);

      prevRaceUnix = gp.schedule["5"];
    });








    const next = getNextRace(data);
    if (next) {
      const nextGp = document.querySelector(".next");
      nextGp.innerHTML = "";

      // Получаем дату и время с учётом GMT
      const d = toUserDate(next.unix, USER_GMT);

      // Названия сессий
      const normalNames = [
        "1-Я ПРАКТИКА",
        "2-Я ПРАКТИКА",
        "3-Я ПРАКТИКА",
        "КВАЛИФИКАЦИЯ",
        "ГОНКА"
      ];
      const sprintNames = [
        "1-Я ПРАКТИКА",
        "СПРИНТ-КВАЛИФИКАЦИЯ",
        "СПРИНТ",
        "КВАЛИФИКАЦИЯ",
        "ГОНКА"
      ];
      const raceNames = next.isSprint ? sprintNames : normalNames;

      nextGp.innerHTML = `
          <div class="f1-title">
        <div class="stack stack-l">
            <div class="bar big"></div>
            <div class="bar small"></div>
        </div>
        <svg viewBox="0 0 120 30">
            <path
                d="M101.086812,30 L101.711812,30 L101.711812,27.106875 L101.722437,27.106875 L102.761812,30 L103.302437,30 L104.341812,27.106875 L104.352437,27.106875 L104.352437,30 L104.977437,30 L104.977437,26.25125 L104.063687,26.25125 L103.055562,29.18625 L103.044937,29.18625 L102.011187,26.25125 L101.086812,26.25125 L101.086812,30 Z M97.6274375,26.818125 L98.8136875,26.818125 L98.8136875,30 L99.4699375,30 L99.4699375,26.818125 L100.661812,26.818125 L100.661812,26.25125 L97.6274375,26.25125 L97.6274375,26.818125 Z M89.9999375,30 L119.999937,0 L101.943687,0 L71.9443125,30 L89.9999375,30 Z M85.6986875,13.065 L49.3818125,13.065 C38.3136875,13.065 36.3768125,13.651875 31.6361875,18.3925 C27.2024375,22.82625 20.0005625,30 20.0005625,30 L35.7324375,30 L39.4855625,26.246875 C41.9530625,23.779375 43.2255625,23.52375 48.4068125,23.52375 L75.2405625,23.52375 L85.6986875,13.065 Z M31.1518125,16.253125 C27.8774375,19.3425 20.7530625,26.263125 16.9130625,30 L-6.25e-05,30 C-6.25e-05,30 13.5524375,16.486875 21.0849375,9.0725 C28.8455625,1.685 32.7143125,0 46.9486875,0 L98.7643125,0 L87.5449375,11.21875 L48.0011875,11.21875 C37.9993125,11.21875 35.7518125,11.911875 31.1518125,16.253125 Z"
                id="path-1"></path>
        </svg>
        <span>2026</span>
        <div class="stack stack-r">
            <div class="bar big"></div>
            <div class="bar small"></div>
        </div>
    </div>
        <div class="title">
            <span>${raceNames[next.idx - 1]} - ${d.day} ${MONTHS_SHORT[d.month]} (${WEEKDAYS[d.weekday]}) ${d.time}</span>
        </div>
        <div class="card">
            <div class="num">
                <span>${next.gpKey}</span>
                ${next.isSprint && next.gp.sprint_num ? `<span class="sprint-num">${next.gp.sprint_num}</span>` : ""}
            </div>
            <div class="flag">
                <img src="flags/${next.gp.svg}.svg" alt="flag">
            </div>
            <div class="country-date">
                <span>${next.gp.name.ru}</span>
                <span class="countdown">00д 00ч 00м 00с</span>
            </div>
        </div>
    `;

      content.appendChild(nextGp);

      startCountdown(next.unix, nextGp.querySelector(".countdown"));
    }
  });


// ---------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------
function toUserDate(unix, userGmt) {
  const date = new Date((unix + (userGmt * 3600)) * 1000);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    weekday: date.getUTCDay(),
    time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  };
}

function pad(n) {
  return n < 10 ? "0" + n : n;
}
























function getNextRace(data) {
  const nowUnix = Math.floor(Date.now() / 1000);
  let nextRace = null;

  Object.entries(data).forEach(([gpKey, gp]) => {
    const isSprint = gp.sprint_num !== null;
    const scheduleEntries = Object.entries(gp.schedule); // [['1', ts], ...]

    scheduleEntries.forEach(([idx, ts]) => {
      if (ts > nowUnix) {
        if (!nextRace || ts < nextRace.unix) {
          nextRace = {
            gpKey,
            gp,
            idx: Number(idx),
            unix: ts,
            isSprint
          };
        }
      }
    });
  });

  return nextRace;
}






function startCountdown(unix, el) {
  function update() {
    const now = Math.floor(Date.now() / 1000);
    let diff = unix - now;
    if (diff < 0) diff = 0;

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    el.textContent = `${days}д ${hours}ч ${minutes}м ${seconds}с`;
  }

  update();
  setInterval(update, 1000);
}

