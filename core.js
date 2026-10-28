export const STORE_KEY = 'quiet-focus-v1';
export function cleanTask(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string' || typeof value.title !== 'string') throw new Error('Некорректная задача');
  const title = value.title.trim();
  if (!title || title.length > 200 || !value.id || value.id.length > 100 || typeof value.done !== 'boolean') throw new Error('Некорректная задача');
  return { id: value.id, title, done: value.done };
}
export function cleanState(value) {
  if (!value || !Array.isArray(value.tasks) || value.tasks.length > 5000) throw new Error('Некорректные данные');
  const tasks = value.tasks.map(cleanTask);
  if (new Set(tasks.map(t => t.id)).size !== tasks.length) throw new Error('Повторяющиеся задачи');
  return { tasks };
}
export function secondsLeft(deadline, now = Date.now()) { return Math.max(0, Math.ceil((deadline - now) / 1000)); }
export function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }
export function filterTasks(tasks, query = '', filter = 'all') {
  const needle = query.trim().toLocaleLowerCase('ru');
  return tasks.filter(task => task.title.toLocaleLowerCase('ru').includes(needle) && (filter === 'all' || (filter === 'done' ? task.done : !task.done)));
}
