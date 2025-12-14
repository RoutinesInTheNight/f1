function showGrandPrixInfo(el) {
  const info = el.closest('.title').nextElementSibling;
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
                <div class="title" onclick="showGrandPrixInfo(this); hapticFeedback('soft')">
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
