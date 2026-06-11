'use strict';

const MONTHS_NOM = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
];
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_PREP = [
  'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
  'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'
];

const SEASONS = {
  winter: { key: 'winter', name: 'Зима', icon: '❄️', accent: '#7ec8ff', months: [11, 0, 1], label: 'декабрь — февраль', dative: 'зиме', accusative: 'зиму' },
  spring: { key: 'spring', name: 'Весна', icon: '🌸', accent: '#ff8ec7', months: [2, 3, 4], label: 'март — май', dative: 'весне', accusative: 'весну' },
  summer: { key: 'summer', name: 'Лето', icon: '☀️', accent: '#ffd166', months: [5, 6, 7], label: 'июнь — август', dative: 'лету', accusative: 'лето' },
  autumn: { key: 'autumn', name: 'Осень', icon: '🍂', accent: '#ff9f43', months: [8, 9, 10], label: 'сентябрь — ноябрь', dative: 'осени', accusative: 'осень' }
};
const SEASON_LIST = Object.values(SEASONS);

const QUARTERS = {
  1: { num: 1, short: 'Q1', label: '1-й квартал', months: [0, 1, 2], range: 'январь — март' },
  2: { num: 2, short: 'Q2', label: '2-й квартал', months: [3, 4, 5], range: 'апрель — июнь' },
  3: { num: 3, short: 'Q3', label: '3-й квартал', months: [6, 7, 8], range: 'июль — сентябрь' },
  4: { num: 4, short: 'Q4', label: '4-й квартал', months: [9, 10, 11], range: 'октябрь — декабрь' }
};

const CONTEXT_PHRASES = [
  { template: '«Новые ноутбуки выйдут в {q}»', type: 'quarter' },
  { template: '«Выручка за {q} выросла»', type: 'quarter' },
  { template: '«Анонс на {season}»', type: 'season' },
  { template: '«Отчёт за прошлый квартал — {q}»', type: 'quarter' },
  { template: '«Запуск продукта в {season}»', type: 'season' }
];

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

// ── SETTINGS ──
let selectedTrainer = 'seasons';
let showReference = true;
let selectedGameMode = 'classic';
let classicCount = 15;
let timedSeconds = 60;

// ── GAME STATE ──
let currentQuestion = null;
let currentChoices = [];
let lastQuestionKey = '';
let correctCount = 0;
let wrongCount = 0;
let streak = 0;
let bestStreak = 0;
let totalQuestions = 15;
let questionNum = 0;
let locked = false;
let lastSettings = {};
let gameStartTime = 0;
let sessionDateKey = '';

let timerInterval = null;
let timerRemaining = 0;
let timerTotal = 0;
let warnedHalf = false;
let warnedCritical = false;
let gameOver = false;

// ── AUDIO ──
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
function getAC() { if (!actx) actx = new AudioCtx(); return actx; }

function playCorrect() {
  try {
    const ctx = getAC(), t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(660, t);
    o.frequency.setValueAtTime(880, t + 0.08);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    o.start(t); o.stop(t + 0.24);
  } catch (e) {}
}

function playWrong() {
  try {
    const ctx = getAC(), t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t);
    o.frequency.setValueAtTime(160, t + 0.12);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    o.start(t); o.stop(t + 0.34);
  } catch (e) {}
}

function playWarn() {
  try {
    const ctx = getAC(), t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(750, t);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.start(t); o.stop(t + 0.45);
  } catch (e) {}
}

function playCritical() {
  try {
    const ctx = getAC();
    [0, 0.17, 0.34].forEach(delay => {
      const t = ctx.currentTime + delay;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square';
      o.frequency.setValueAtTime(900, t);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      o.start(t); o.stop(t + 0.13);
    });
  } catch (e) {}
}

function playTimeUp() {
  try {
    const ctx = getAC();
    [440, 349, 261].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.22;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.start(t); o.stop(t + 0.5);
    });
  } catch (e) {}
}

function formatDateKey(date) {
  return AppDB.formatDateKey(date);
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function recordSession(summary) {
  AppDB.recordSession({
    date: sessionDateKey || formatDateKey(new Date()),
    timestamp: Date.now(),
    trainer: summary.trainer,
    gameMode: summary.gameMode,
    correct: summary.correct,
    wrong: summary.wrong,
    answered: summary.answered,
    bestStreak: summary.bestStreak,
    elapsedSec: summary.elapsedSec
  });
}

function pluralDays(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
  return 'дней';
}

function pluralSessions(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'сессия';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'сессии';
  return 'сессий';
}

// ── CALENDAR DATA ──
function getSeasonForMonth(monthIndex) {
  return SEASON_LIST.find(s => s.months.includes(monthIndex)) || SEASONS.summer;
}

function getQuarterForMonth(monthIndex) {
  return Math.floor(monthIndex / 3) + 1;
}

function formatFullDate(date) {
  return `${date.getDate()} ${MONTHS_GEN[date.getMonth()]} ${date.getFullYear()}`;
}

function getQuarterLabel(date) {
  const q = getQuarterForMonth(date.getMonth());
  return `${q}-й квартал ${date.getFullYear()}`;
}

function applySeasonTheme(date) {
  const season = getSeasonForMonth(date.getMonth());
  document.documentElement.style.setProperty('--season-accent', season.accent);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickDistinct(pool, count, exclude = []) {
  const available = pool.filter(x => !exclude.includes(x));
  return shuffle(available).slice(0, count);
}

const TRAINER_NAMES = { seasons: 'Сезоны', quarters: 'Кварталы', mixed: 'Смешанный' };
const WEEK_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

function renderDashboard(date = new Date()) {
  const month = date.getMonth();
  const season = getSeasonForMonth(month);
  const quarter = QUARTERS[getQuarterForMonth(month)];
  applySeasonTheme(date);

  document.getElementById('today-weekday').textContent = WEEKDAYS[date.getDay()];
  document.getElementById('today-full-date').textContent = formatFullDate(date);
  document.getElementById('season-icon').textContent = season.icon;
  document.getElementById('season-name').textContent = season.name;
  document.getElementById('season-months').textContent = season.label;
  document.getElementById('quarter-badge').textContent = `${quarter.label} ${date.getFullYear()}`;
  document.getElementById('quarter-detail').textContent = quarter.range;

  const stats = AppDB.getOverallStats(date);
  document.getElementById('daily-streak-badge').innerHTML =
    `🔥 <span>${stats.dailyStreak}</span> ${pluralDays(stats.dailyStreak)}`;
  document.getElementById('kpi-streak').textContent = stats.dailyStreak;
  document.getElementById('kpi-sessions').textContent = stats.totalSessions;
  document.getElementById('kpi-accuracy').textContent = `${stats.accuracy}%`;
  document.getElementById('kpi-today').textContent = stats.todayCount;

  const todayBtn = document.getElementById('today-start-btn');
  const doneToday = AppDB.hasSessionToday(date);
  todayBtn.textContent = doneToday ? 'Продолжить на сегодня' : 'Тренировка на сегодня';
  todayBtn.classList.toggle('done-today', doneToday);

  renderYearCalendar(date);
  renderWeeklyActivity(date);
  renderTrainerBreakdown();
  renderRecentSessions();
}

function renderWeeklyActivity(date = new Date()) {
  const container = document.getElementById('weekly-activity');
  const days = AppDB.getWeeklyActivity(date);
  const max = Math.max(1, ...days.map(d => d.count));
  const todayKey = formatDateKey(date);
  container.innerHTML = days.map(d => {
    const h = Math.max(8, Math.round((d.count / max) * 48));
    const cls = [
      'week-bar',
      d.count > 0 ? 'has-data' : '',
      d.date === todayKey ? 'is-today' : ''
    ].filter(Boolean).join(' ');
    return `<div class="week-bar-wrap">
      <div class="week-bar-count">${d.count || ''}</div>
      <div class="${cls}" style="height:${h}px"></div>
      <div class="week-bar-label">${WEEK_SHORT[d.weekday]}</div>
    </div>`;
  }).join('');
}

function renderTrainerBreakdown() {
  const container = document.getElementById('trainer-breakdown');
  const rows = AppDB.getTrainerBreakdown();
  if (rows.length === 0) {
    container.innerHTML = '<div class="recent-empty">Пока нет данных — начни первую сессию.</div>';
    return;
  }
  container.innerHTML = rows.map(r => {
    const name = TRAINER_NAMES[r.trainer] || r.trainer;
    return `<div class="breakdown-row">
      <div>
        <div class="breakdown-name">${name}</div>
        <div class="breakdown-meta">${r.sessions} ${pluralSessions(r.sessions)} · ${r.accuracy}%</div>
      </div>
      <div class="breakdown-bar-wrap"><div class="breakdown-bar-fill" style="width:${r.accuracy}%"></div></div>
    </div>`;
  }).join('');
}

function renderRecentSessions() {
  const container = document.getElementById('recent-sessions');
  const sessions = AppDB.getRecentSessions(6);
  if (sessions.length === 0) {
    container.innerHTML = '<div class="recent-empty">Сессии появятся здесь после тренировки.</div>';
    return;
  }
  container.innerHTML = sessions.map(s => {
    const name = TRAINER_NAMES[s.trainer] || s.trainer;
    const pct = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
    return `<div class="recent-row">
      <span class="recent-date">${s.date}</span>
      <span class="recent-trainer">${name}</span>
      <span class="recent-score">${s.correct}/${s.answered} · ${pct}%</span>
    </div>`;
  }).join('');
}

function renderYearCalendar(date = new Date()) {
  const container = document.getElementById('year-calendar');
  const todayMonth = date.getMonth();
  container.innerHTML = MONTHS_SHORT.map((short, i) => {
    const season = getSeasonForMonth(i);
    const quarter = getQuarterForMonth(i);
    const classes = [
      'month-cell',
      `season-${season.key}`,
      `quarter-q${quarter}`,
      i === todayMonth ? 'is-today' : ''
    ].filter(Boolean).join(' ');
    return `<div class="${classes}" title="${MONTHS_NOM[i]} · ${season.name} · Q${quarter}">
      <span class="month-short">${short}</span>
      <span class="month-q">Q${quarter}</span>
    </div>`;
  }).join('');
}

function renderReferencePanel(highlight = {}) {
  const panel = document.getElementById('reference-panel');
  if (!panel) return;
  if (!showReference) {
    panel.className = 'reference-panel hidden';
    panel.innerHTML = '';
    return;
  }

  const { month, seasonKey, quarterNum } = highlight;

  const seasonRows = SEASON_LIST.map(s => {
    const monthTags = s.months.map(m => {
      const cls = [
        'ref-month',
        month === m ? 'highlight' : '',
        seasonKey === s.key ? 'group-highlight' : ''
      ].filter(Boolean).join(' ');
      return `<span class="${cls}">${MONTHS_SHORT[m]}</span>`;
    }).join('');
    const rowCls = seasonKey === s.key ? 'ref-season-row highlight-row' : 'ref-season-row';
    return `<div class="${rowCls}">
      <div class="ref-row-head">${s.icon} ${s.name}</div>
      <div class="ref-months">${monthTags}</div>
    </div>`;
  }).join('');

  const quarterRows = Object.values(QUARTERS).map(q => {
    const monthTags = q.months.map(m => {
      const cls = [
        'ref-month',
        month === m ? 'highlight' : '',
        quarterNum === q.num ? 'group-highlight' : ''
      ].filter(Boolean).join(' ');
      return `<span class="${cls}">${MONTHS_SHORT[m]}</span>`;
    }).join('');
    const rowCls = quarterNum === q.num ? 'ref-quarter-row highlight-row' : 'ref-quarter-row';
    return `<div class="${rowCls}">
      <div class="ref-row-head">${q.short} · ${q.range}</div>
      <div class="ref-months">${monthTags}</div>
    </div>`;
  }).join('');

  panel.className = 'reference-panel';
  panel.innerHTML = `
    <div class="ref-head">
      <div class="ref-title">Справочник</div>
      <div class="ref-meta">подсветка текущего вопроса</div>
    </div>
    <div class="ref-section">
      <div class="ref-section-label">Сезоны</div>
      ${seasonRows}
    </div>
    <div class="ref-section">
      <div class="ref-section-label">Кварталы</div>
      ${quarterRows}
    </div>
  `;
}

// ── QUESTION GENERATION ──
function getTrainerPool() {
  if (selectedTrainer === 'seasons') return ['seasons'];
  if (selectedTrainer === 'quarters') return ['quarters'];
  return ['seasons', 'quarters'];
}

function generateQuestion() {
  const pool = getTrainerPool();
  const domain = pickRandom(pool);
  const generators = domain === 'seasons'
    ? [genMonthToSeason, genSeasonPickMonth, genMonthsInSeason, genContextSeason]
    : [genMonthToQuarter, genQuarterMonthsSet, genQuarterPickMonth, genContextQuarter];

  let q, attempts = 0;
  do {
    q = pickRandom(generators)();
    attempts++;
  } while (q.key === lastQuestionKey && attempts < 20);

  lastQuestionKey = q.key;
  return q;
}

function genMonthToSeason() {
  const month = randInt(0, 11);
  const season = getSeasonForMonth(month);
  const wrong = pickDistinct(SEASON_LIST.map(s => s.name), 3, [season.name]);
  const choices = shuffle([season.name, ...wrong]);
  return {
    key: `mts-${month}`,
    domain: 'seasons',
    context: '',
    prompt: `Какой сезон у ${MONTHS_GEN[month]}?`,
    answer: season.name,
    choices,
    highlight: { month, seasonKey: season.key }
  };
}

function genSeasonPickMonth() {
  const season = pickRandom(SEASON_LIST);
  const correct = pickRandom(season.months);
  const wrong = pickDistinct(
    [...Array(12).keys()],
    3,
    season.months
  );
  const choices = shuffle([MONTHS_NOM[correct], ...wrong.map(m => MONTHS_NOM[m])]);
  return {
    key: `spm-${season.key}-${correct}`,
    domain: 'seasons',
    context: '',
    prompt: `Какой месяц относится к ${season.dative}?`,
    answer: MONTHS_NOM[correct],
    choices,
    highlight: { month: correct, seasonKey: season.key }
  };
}

function genMonthsInSeason() {
  const season = pickRandom(SEASON_LIST);
  const correct = season.months.map(m => MONTHS_NOM[m]).join(', ');
  const wrongRanges = pickDistinct(
    SEASON_LIST.map(s => s.months.map(m => MONTHS_NOM[m]).join(', ')),
    3,
    [correct]
  );
  const choices = shuffle([correct, ...wrongRanges]);
  return {
    key: `mis-${season.key}`,
    domain: 'seasons',
    context: '',
    prompt: `Какие месяцы входят в ${season.accusative}?`,
    answer: correct,
    choices,
    highlight: { seasonKey: season.key }
  };
}

function genContextSeason() {
  const season = pickRandom(SEASON_LIST);
  const phrase = pickRandom(CONTEXT_PHRASES.filter(p => p.type === 'season'));
  const wrong = pickDistinct(SEASON_LIST.map(s => s.label), 3, [season.label]);
  const choices = shuffle([season.label, ...wrong]);
  return {
    key: `ctxs-${season.key}`,
    domain: 'seasons',
    context: phrase.template.replace('{season}', season.accusative),
    prompt: 'Это какие месяцы?',
    answer: season.label,
    choices,
    highlight: { seasonKey: season.key }
  };
}

function genMonthToQuarter() {
  const month = randInt(0, 11);
  const qNum = getQuarterForMonth(month);
  const correct = QUARTERS[qNum].short;
  const wrong = pickDistinct(['Q1', 'Q2', 'Q3', 'Q4'], 3, [correct]);
  const choices = shuffle([correct, ...wrong]);
  return {
    key: `mtq-${month}`,
    domain: 'quarters',
    context: '',
    prompt: `В каком квартале ${MONTHS_PREP[month]}?`,
    answer: correct,
    choices,
    highlight: { month, quarterNum: qNum }
  };
}

function genQuarterMonthsSet() {
  const q = pickRandom(Object.values(QUARTERS));
  const wrong = pickDistinct(Object.values(QUARTERS).map(x => x.range), 3, [q.range]);
  const choices = shuffle([q.range, ...wrong]);
  return {
    key: `qms-${q.num}`,
    domain: 'quarters',
    context: '',
    prompt: `Какие месяцы в ${q.short}?`,
    answer: q.range,
    choices,
    highlight: { quarterNum: q.num }
  };
}

function genQuarterPickMonth() {
  const q = pickRandom(Object.values(QUARTERS));
  const correct = pickRandom(q.months);
  const wrong = pickDistinct([...Array(12).keys()], 3, q.months);
  const choices = shuffle([MONTHS_NOM[correct], ...wrong.map(m => MONTHS_NOM[m])]);
  return {
    key: `qpm-${q.num}-${correct}`,
    domain: 'quarters',
    context: '',
    prompt: `Какой месяц входит в ${q.short}?`,
    answer: MONTHS_NOM[correct],
    choices,
    highlight: { month: correct, quarterNum: q.num }
  };
}

function genContextQuarter() {
  const q = pickRandom(Object.values(QUARTERS));
  const phrase = pickRandom(CONTEXT_PHRASES.filter(p => p.type === 'quarter'));
  const wrong = pickDistinct(Object.values(QUARTERS).map(x => x.range), 3, [q.range]);
  const choices = shuffle([q.range, ...wrong]);
  return {
    key: `ctxq-${q.num}`,
    domain: 'quarters',
    context: phrase.template.replace('{q}', q.short),
    prompt: 'О каких месяцах речь?',
    answer: q.range,
    choices,
    highlight: { quarterNum: q.num }
  };
}

// ── MENU CONTROLS ──
function selectTrainer(btn) {
  document.querySelectorAll('.trainer-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedTrainer = btn.dataset.trainer;
}

function selectGameMode(btn) {
  document.querySelectorAll('.gm-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedGameMode = btn.dataset.gm;
  document.getElementById('opts-classic').style.display = selectedGameMode === 'classic' ? 'block' : 'none';
  document.getElementById('opts-timed').style.display = selectedGameMode === 'timed' ? 'block' : 'none';
  const subLabel = document.getElementById('sub-label');
  if (subLabel) subLabel.textContent = selectedGameMode === 'classic' ? 'вопросов' : 'время';
}

function selectSub(btn) {
  btn.closest('.sub-grid').querySelectorAll('.sub-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const val = parseInt(btn.dataset.val);
  if (selectedGameMode === 'classic') classicCount = val;
  else timedSeconds = val;
}

function syncSettingsFromControls() {
  const guideToggle = document.getElementById('guide-toggle');
  const selectedTrainerBtn = document.querySelector('.trainer-btn.selected');
  const selectedGameBtn = document.querySelector('.gm-btn.selected');
  const activeOpts = document.getElementById('opts-' + (selectedGameBtn?.dataset.gm || selectedGameMode));
  const selectedSub = activeOpts?.querySelector('.sub-btn.selected');

  selectedTrainer = selectedTrainerBtn?.dataset.trainer || selectedTrainer;
  selectedGameMode = selectedGameBtn?.dataset.gm || selectedGameMode;
  showReference = guideToggle ? guideToggle.checked : showReference;
  if (selectedSub) selectSub(selectedSub);
}

function syncControlsFromState() {
  document.querySelectorAll('.trainer-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.trainer === selectedTrainer);
  });
  document.getElementById('guide-toggle').checked = showReference;
}

function trainerLabel(trainer) {
  if (trainer === 'seasons') return 'сезоны';
  if (trainer === 'quarters') return 'кварталы';
  return 'смешанный';
}

function startTodayTraining() {
  const trainers = ['seasons', 'quarters', 'mixed'];
  selectedTrainer = pickRandom(trainers);
  document.querySelectorAll('.trainer-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.trainer === selectedTrainer);
  });
  startGame();
}

// ── GAME FLOW ──
function startGame() {
  syncSettingsFromControls();
  lastSettings = { trainer: selectedTrainer, showReference, gameMode: selectedGameMode, classicCount, timedSeconds };
  correctCount = 0; wrongCount = 0; streak = 0; bestStreak = 0;
  questionNum = 0; locked = false; gameOver = false;
  lastQuestionKey = '';
  currentQuestion = null;
  warnedHalf = false; warnedCritical = false;
  gameStartTime = Date.now();
  sessionDateKey = formatDateKey(new Date());
  totalQuestions = selectedGameMode === 'classic' ? classicCount : Infinity;

  document.getElementById('trainer-label').textContent = trainerLabel(selectedTrainer);
  showScreen('game');
  window.scrollTo(0, 0);
  renderReferencePanel();
  setupTimer();
  nextQuestion();
}

function restartGame() {
  selectedTrainer = lastSettings.trainer || selectedTrainer;
  showReference = lastSettings.showReference !== false;
  selectedGameMode = lastSettings.gameMode || selectedGameMode;
  classicCount = lastSettings.classicCount || classicCount;
  timedSeconds = lastSettings.timedSeconds || timedSeconds;
  startGame();
}

function setupTimer() {
  clearInterval(timerInterval);
  const hasClock = selectedGameMode === 'timed';
  document.getElementById('timer-row').style.display = hasClock ? 'flex' : 'none';
  document.getElementById('progress-bar').style.display = hasClock ? 'none' : 'block';
  if (!hasClock) return;
  timerTotal = timedSeconds;
  timerRemaining = timerTotal;
  renderTimer();
  timerInterval = setInterval(tickTimer, 250);
}

function tickTimer() {
  if (gameOver) { clearInterval(timerInterval); return; }
  timerRemaining = Math.max(0, timerRemaining - 0.25);
  const pct = timerRemaining / timerTotal;
  if (!warnedHalf && pct <= 0.5) { warnedHalf = true; playWarn(); }
  if (!warnedCritical && pct <= 0.2) { warnedCritical = true; playCritical(); }
  renderTimer();
  if (timerRemaining <= 0) {
    clearInterval(timerInterval);
    triggerTimeUp();
  }
}

function renderTimer() {
  const secs = Math.ceil(timerRemaining);
  const pct = timerTotal > 0 ? timerRemaining / timerTotal : 0;
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const disp = document.getElementById('timer-display');
  const bar = document.getElementById('timer-bar-fill');
  disp.textContent = timerTotal >= 60 ? `${mins}:${String(s).padStart(2, '0')}` : `${secs}`;
  bar.style.width = (pct * 100) + '%';
  const cls = pct <= 0.2 ? 'critical' : pct <= 0.5 ? 'warn' : '';
  disp.className = 'timer-display' + (cls ? ' ' + cls : '');
  bar.className = 'timer-bar-fill' + (cls ? ' ' + cls : '');
  document.getElementById('qcount-display').textContent = `${correctCount} ✓`;
}

function triggerTimeUp() {
  if (gameOver) return;
  gameOver = true;
  locked = true;
  playTimeUp();
  document.getElementById('timesup-stats').textContent =
    `✓ ${correctCount}  ✗ ${wrongCount}  серия: ${bestStreak}`;
  document.getElementById('timesup-overlay').classList.add('show');
  setTimeout(() => {
    document.getElementById('timesup-overlay').classList.remove('show');
    showScore();
  }, 1900);
}

function nextQuestion() {
  if (gameOver) return;
  if (selectedGameMode === 'classic' && questionNum >= totalQuestions) {
    clearInterval(timerInterval);
    showScore();
    return;
  }

  const q = generateQuestion();
  currentQuestion = q;
  currentChoices = q.choices;
  locked = false;

  const ctxEl = document.getElementById('question-context');
  ctxEl.textContent = q.context || '';
  ctxEl.style.display = q.context ? 'block' : 'none';

  document.getElementById('question-text').textContent = q.prompt;
  document.getElementById('question-answer').textContent = '';
  document.getElementById('question-answer').className = 'question-answer';

  const qBox = document.getElementById('question-box');
  qBox.className = 'question-box';
  void qBox.offsetWidth;
  qBox.classList.add('anim-pop');

  const grid = document.getElementById('choices-grid');
  grid.classList.toggle('choices-wide', q.choices.some(c => c.length > 14));

  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById('c' + i);
    btn.textContent = currentChoices[i];
    btn.className = 'choice-btn';
    btn.disabled = false;
  }

  if (selectedGameMode === 'classic') {
    document.getElementById('progress-fill').style.width = (questionNum / totalQuestions * 100) + '%';
  }

  renderReferencePanel(q.highlight);
  updateHUD();
  questionNum++;
}

function updateHUD() {
  document.getElementById('streak-count').textContent = streak;
  document.getElementById('score-correct').textContent = correctCount;
  document.getElementById('score-wrong').textContent = wrongCount;
}

function selectChoice(idx) {
  if (locked || gameOver) return;
  const chosen = currentChoices[idx];
  for (let i = 0; i < 4; i++) document.getElementById('c' + i).disabled = true;
  const btn = document.getElementById('c' + idx);
  if (chosen === currentQuestion.answer) {
    btn.classList.add('correct-choice');
    handleCorrect();
  } else {
    btn.classList.add('wrong-choice');
    const ci = currentChoices.indexOf(currentQuestion.answer);
    if (ci !== -1) document.getElementById('c' + ci).classList.add('correct-choice');
    handleWrong(chosen);
  }
}

function handleCorrect() {
  locked = true;
  correctCount++; streak++;
  if (streak > bestStreak) bestStreak = streak;
  updateHUD();
  playCorrect();
  showFlash('correct-flash');
  document.getElementById('question-box').classList.add('correct');
  const ans = document.getElementById('question-answer');
  ans.textContent = '✓'; ans.className = 'question-answer show-correct';
  setTimeout(() => nextQuestion(), 220);
}

function handleWrong(chosen) {
  locked = true;
  wrongCount++; streak = 0;
  updateHUD();
  playWrong();
  showFlash('wrong-flash');
  const qBox = document.getElementById('question-box');
  qBox.classList.add('wrong');
  void qBox.offsetWidth;
  qBox.classList.add('anim-shake');
  const ans = document.getElementById('question-answer');
  ans.textContent = `→ ${currentQuestion.answer}`;
  ans.className = 'question-answer show-wrong';
  setTimeout(() => nextQuestion(), 1100);
}

function handleFastGameButtonPress(event) {
  if (event.type === 'mousedown' && window.PointerEvent) return;
  if (event.button !== 0) return;
  const choiceButton = event.target.closest('.choice-btn');
  if (choiceButton) {
    event.preventDefault();
    selectChoice(parseInt(choiceButton.dataset.choiceIdx));
  }
}

function handleQuitPress(event) {
  if (event.type === 'mousedown' && window.PointerEvent) return;
  if (event.button !== 0) return;
  event.preventDefault();
  quitGame();
}

function showFlash(cls) {
  const f = document.getElementById('flash');
  f.className = 'flash ' + cls + ' visible';
  setTimeout(() => f.classList.remove('visible'), 140);
}

function quitGame() {
  clearInterval(timerInterval);
  gameOver = true;
  if (correctCount + wrongCount > 0) showScore();
  else goMenu();
}

function showScore() {
  clearInterval(timerInterval);
  const elapsed = ((Date.now() - gameStartTime) / 1000).toFixed(1);
  const answered = correctCount + wrongCount;

  let modeLabel, subLine, timeLine = null;
  if (selectedGameMode === 'classic') {
    const pct = answered > 0 ? Math.round((correctCount / answered) * 100) : 0;
    modeLabel = trainerLabel(selectedTrainer);
    subLine = `правильно: ${correctCount} из ${answered} · ${pct}%`;
    timeLine = `время: ${elapsed} сек`;
  } else {
    modeLabel = trainerLabel(selectedTrainer) + ' · на время';
    subLine = `вопросов: ${answered} · правильно: ${correctCount} · ошибок: ${wrongCount}`;
  }

  recordSession({
    trainer: selectedTrainer,
    gameMode: selectedGameMode,
    correct: correctCount,
    wrong: wrongCount,
    answered,
    bestStreak,
    elapsedSec: parseFloat(elapsed)
  });

  const sessionDate = parseDateKey(sessionDateKey || formatDateKey(new Date()));
  applySeasonTheme(sessionDate);
  const dailyStreak = AppDB.calculateDailyStreak(sessionDate);

  document.getElementById('score-mode-label').textContent = modeLabel;
  document.getElementById('final-score').textContent = correctCount;
  document.getElementById('final-sub').textContent = subLine;
  document.getElementById('final-streak').textContent = `лучшая серия: ${bestStreak}`;
  document.getElementById('final-daily-streak').textContent =
    `серия дней: ${dailyStreak} ${pluralDays(dailyStreak)}`;
  document.getElementById('final-date').textContent =
    `${WEEKDAYS[sessionDate.getDay()]}, ${formatFullDate(sessionDate)}`;

  const timeEl = document.getElementById('final-time');
  if (timeLine) { timeEl.textContent = timeLine; timeEl.style.display = 'block'; }
  else timeEl.style.display = 'none';

  showScreen('score');
}

function goMenu() {
  syncControlsFromState();
  renderDashboard();
  showScreen('menu');
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

// ── EVENTS ──
function bindEvents() {
  document.querySelectorAll('.trainer-btn').forEach(btn => {
    btn.addEventListener('click', () => selectTrainer(btn));
  });
  document.querySelectorAll('.gm-btn').forEach(btn => {
    btn.addEventListener('click', () => selectGameMode(btn));
  });
  document.querySelectorAll('.sub-btn').forEach(btn => {
    btn.addEventListener('click', () => selectSub(btn));
  });
  document.getElementById('guide-toggle').addEventListener('change', e => {
    showReference = e.target.checked;
  });
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('today-start-btn').addEventListener('click', startTodayTraining);
  const quitBtn = document.getElementById('quit-btn');
  quitBtn.addEventListener('pointerdown', handleQuitPress);
  quitBtn.addEventListener('mousedown', handleQuitPress);
  quitBtn.addEventListener('click', quitGame);
  document.getElementById('menu-btn').addEventListener('click', goMenu);
  document.getElementById('restart-btn').addEventListener('click', restartGame);

  const grid = document.getElementById('choices-grid');
  grid.addEventListener('pointerdown', handleFastGameButtonPress);
  grid.addEventListener('mousedown', handleFastGameButtonPress);
}

bindEvents();

async function initApp() {
  try {
    await AppDB.init();
  } catch (e) {
    console.error('SQLite init failed', e);
  }
  renderDashboard();
}

initApp();