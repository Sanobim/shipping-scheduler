const test = require('node:test');
const assert = require('node:assert');
const { calculateShippingDate } = require('./shipping_scheduler');

function iso(d) { return d; } 

test('Normal before cutoff ships same day (business day)', () => {
  const out = calculateShippingDate('2025-09-24 11:45', [], { return: 'iso' });
  assert.strictEqual(out, iso('2025-09-24'));
});

test('Exactly at cutoff ships next business day', () => {
  const out = calculateShippingDate('2025-09-23 12:00', [], { return: 'iso' });
  assert.strictEqual(out, iso('2025-09-24'));
});

test('After cutoff ships next business day', () => {
  const out = calculateShippingDate('2025-09-23 12:01', [], { return: 'iso' });
  assert.strictEqual(out, iso('2025-09-24'));
});

test('Weekend rolls forward to Monday', () => {
  const out = calculateShippingDate('2025-09-27 10:00', [], { return: 'iso' });
  assert.strictEqual(out, iso('2025-09-29'));
});

test('Holiday rolls forward', () => {
  const out = calculateShippingDate('2025-12-23 10:00', ['2025-12-23'], { return: 'iso' });
  assert.strictEqual(out, iso('2025-12-24'));
});

test('Last Friday after noon -> following Monday', () => {
  const out = calculateShippingDate('2025-09-26 12:30', [], { return: 'iso' });
  assert.strictEqual(out, iso('2025-09-29'));
});

test('Last Friday after noon and Monday holiday -> Tuesday', () => {
  const out = calculateShippingDate('2025-09-26 13:00', ['2025-09-29'], { return: 'iso' });
  assert.strictEqual(out, iso('2025-09-30'));
});

test('Last Friday exactly at noon uses normal rule (next business day)', () => {
  const out = calculateShippingDate('2025-09-26 12:00', [], { return: 'iso' });
  assert.strictEqual(out, iso('2025-09-29'));
});

test('End-of-month & leap year handling', () => {
  const out1 = calculateShippingDate('2024-02-29 11:00', [], { return: 'iso' });
  assert.strictEqual(out1, iso('2024-02-29'));

  const out2 = calculateShippingDate('2025-01-31 16:00', [], { return: 'iso' });
  assert.strictEqual(out2, iso('2025-02-03'));
});

test('Timezone awareness (+02:00 parsed and normalized to UTC)', () => {
  const out = calculateShippingDate('2025-09-23T12:30:00+02:00', [], { return: 'iso' });
  assert.strictEqual(out, iso('2025-09-23'));
});
