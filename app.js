import { STORE_KEY, cleanState, secondsLeft, formatTime, filterTasks } from './core.js';
const $ = selector => document.querySelector(selector);
let state = { tasks: [] };
let selectedId = null;
let duration = 25 * 60;
let remaining = duration;
let deadline = null;
let running = false;
let ticker = null;
const announce = message => { $('#status').textContent = message; };
try {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) state = cleanState(JSON.parse(saved));
} catch { announce('Не удалось прочитать сохранённые задачи. Если у вас есть копия, восстановите её.'); }
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
  catch { announce('Браузер не разрешает сохранить данные. Держите вкладку открытой.'); return false; }
}
function render() {
  const done = state.tasks.filter(t => t.done).length;
  $('#progress-number').textContent = done;
  $('#progress').max = state.tasks.length || 1;
  $('#progress').value = done;
  $('#task-count').textContent = `${state.tasks.length} всего`;
  const visible = filterTasks(state.tasks, $('#search').value, $('#filter').value);
  $('#empty').hidden = visible.length > 0;
  $('#empty h3').textContent = state.tasks.length ? 'Подходящих задач нет' : 'Здесь начинается ясность';
  $('#empty p').textContent = state.tasks.length ? 'Попробуйте другой запрос или выберите «Все задачи».' : 'Добавьте первое дело. Большие планы начинаются с небольшого шага.';
  $('#tasks').replaceChildren();
  for (const task of visible) {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}${selectedId === task.id ? ' active' : ''}`;
    const check = document.createElement('input');
    check.type = 'checkbox'; check.className = 'task-check'; check.checked = task.done;
    check.setAttribute('aria-label', `Выполнено: ${task.title}`);
    check.addEventListener('change', () => {
      task.done = check.checked; save(); render();
      announce(task.done ? `Готово: ${task.title}` : `Возвращено в работу: ${task.title}`);
    });
    const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
    const focus = document.createElement('button'); focus.className = 'text-button'; focus.textContent = 'Фокус';
    focus.disabled = task.done; focus.setAttribute('aria-label', `Сосредоточиться: ${task.title}`);
    focus.addEventListener('click', () => { selectedId = task.id; $('#focus-task').textContent = task.title; render(); announce(`Выбрано: ${task.title}`); });
    const remove = document.createElement('button'); remove.className = 'text-button delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `Удалить: ${task.title}`);
    remove.addEventListener('click', () => {
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      if (selectedId === task.id) { selectedId = null; $('#focus-task').textContent = 'Свободная сессия'; }
      save(); render(); announce('Задача удалена.');
    });
    li.append(check, title, focus, remove); $('#tasks').append(li);
  }
}
$('#task-form').addEventListener('submit', event => {
  event.preventDefault(); const title = $('#task-input').value.trim();
  if (!title) { $('#task-input').focus(); return; }
  if (state.tasks.length >= 5000) { announce('Лимит — 5000 задач. Удалите ненужные задачи.'); return; }
  state.tasks.push({ id: crypto.randomUUID(), title, done: false });
  $('#search').value = ''; $('#filter').value = 'all';
  save(); render(); $('#task-input').value = ''; $('#task-input').focus(); announce('Задача добавлена.');
});
$('#search').addEventListener('input', render);
$('#filter').addEventListener('change', render);
function drawTimer() { $('#timer').textContent = formatTime(remaining); document.title = running ? `${formatTime(remaining)} — Тихий фокус` : 'Тихий фокус — пространство для важных дел'; }
function stopTicker() { clearInterval(ticker); ticker = null; }
function tick() {
  if (!running) return;
  remaining = secondsLeft(deadline); drawTimer();
  if (remaining === 0) {
    running = false; stopTicker(); $('#start').textContent = 'Ещё одна сессия';
    $('#timer-caption').textContent = 'Сессия завершена';
    $('#session-info').textContent = duration === 300 ? 'Перерыв окончен. Можно вернуться к делу.' : 'Хорошая работа. Потянитесь и сделайте небольшой перерыв.';
    announce('Сессия завершена.');
  }
}
$('#start').addEventListener('click', () => {
  if (running) { tick(); running = false; stopTicker(); $('#start').textContent = remaining ? 'Продолжить' : 'Ещё одна сессия'; }
  else { if (!remaining) remaining = duration; deadline = Date.now() + remaining * 1000; running = true; ticker = setInterval(tick, 250); $('#start').textContent = 'Пауза'; $('#timer-caption').textContent = duration === 300 ? 'Пора отдохнуть' : 'Сейчас вы здесь'; }
  drawTimer();
});
function resetTimer() { running = false; stopTicker(); remaining = duration; $('#start').textContent = 'Начать фокус'; $('#timer-caption').textContent = 'Одна задача. Один шаг.'; drawTimer(); }
$('#reset').addEventListener('click', resetTimer);
document.querySelectorAll('[data-minutes]').forEach(button => button.addEventListener('click', () => {
  duration = Number(button.dataset.minutes) * 60; resetTimer();
  document.querySelectorAll('[data-minutes]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
}));
document.addEventListener('visibilitychange', tick);
$('#today').textContent = new Intl.DateTimeFormat('ru', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
render(); drawTimer();
