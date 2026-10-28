import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanState, secondsLeft, formatTime, filterTasks } from '../core.js';
test('restores tasks without allowing arbitrary properties', () => {
  assert.deepEqual(cleanState({tasks:[{id:'a',title:'  Дело  ',done:false,extra:'ignored'}]}), {tasks:[{id:'a',title:'Дело',done:false}]});
});
test('rejects malformed or ambiguous stored state', () => {
  for (const value of [null, {}, {tasks:[{id:'a',title:'',done:false}]}, {tasks:[{id:'a',title:'x',done:'false'}]}, {tasks:[{id:'a',title:'x',done:false},{id:'a',title:'y',done:true}]}]) assert.throws(() => cleanState(value));
});
test('timer follows wall clock after a sleeping or throttled tab', () => {
  assert.equal(secondsLeft(1500000, 600000), 900);
  assert.equal(secondsLeft(1500000, 1600000), 0);
  assert.equal(secondsLeft(1001, 0), 2);
  assert.equal(formatTime(1500), '25:00');
  assert.equal(formatTime(0), '00:00');
});
test('search combines Cyrillic case-insensitive matching and completion filter', () => {
  const tasks = [{id:'a',title:'Купить чай',done:false},{id:'b',title:'Купить хлеб',done:true}];
  assert.deepEqual(filterTasks(tasks, ' КУПИТЬ ', 'active').map(t=>t.id), ['a']);
  assert.deepEqual(filterTasks(tasks, '', 'done').map(t=>t.id), ['b']);
  assert.equal(filterTasks(tasks, 'кофе').length, 0);
  assert.equal(tasks.length, 2);
});
