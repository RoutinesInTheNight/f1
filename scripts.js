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
        SafeAreaManager.onChange(getTotalSafeAreas());
      }
    };

    telegram.onEvent('safeAreaChanged', updateAndNotify);
    telegram.onEvent('contentSafeAreaChanged', updateAndNotify);
    updateAndNotify();
  }

  return {
    init,
    getTotalSafeAreas,
    onChange: null
  };
})();





document.addEventListener('DOMContentLoaded', () => {
  const next = document.querySelector('.next');
  const f1Title = document.querySelector('.f1-title');

  SafeAreaManager.onChange = ({ top, bottom }) => {
    const bottomValue = bottom === 0 ? 'calc((100 / 428) * 8 * var(--vw))' : `${bottom}px`;
    const topValue = top === 0 ? 'calc(100 / 428 * 8 * var(--vw))' : `${top}px`;

    const huy = next.querySelector('.title span');
    huy.textContent = `${top}px`;



    next.style.marginTop = topValue;
    f1Title.style.marginTop = top === 0 ? 'calc(100 / 428 * 100 * var(--vw))' : `${top}px`;
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

const MONTHS = [
  "ЯНВАРЯ", "ФЕВРАЛЯ", "МАРТА", "АПРЕЛЯ", "МАЯ", "ИЮНЯ",
  "ИЮЛЯ", "АВГУСТА", "СЕНТЯБРЯ", "ОКТЯБРЯ", "НОЯБРЯ", "ДЕКАБРЯ"
];

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
