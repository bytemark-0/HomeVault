import assert from 'node:assert/strict';

import {
  addDaysToDateInput,
  computeNextDueDate,
  formatCurrency,
  getTaskStateForDate,
} from '../apps/mobile/src/utils/taskUtils';

async function main() {
  await test('addDaysToDateInput adds days to a date', () => {
    assert.equal(addDaysToDateInput(new Date('2026-01-01'), 30), '2026-01-31');
    assert.equal(addDaysToDateInput(new Date('2026-01-01'), 365), '2027-01-01');
    assert.equal(addDaysToDateInput(new Date('2026-01-31'), 1), '2026-02-01');
  });

  await test('addDaysToDateInput handles month overflow correctly', () => {
    assert.equal(addDaysToDateInput(new Date('2026-01-30'), 3), '2026-02-02');
    assert.equal(addDaysToDateInput(new Date('2026-02-28'), 1), '2026-03-01');
  });

  await test('computeNextDueDate returns null for unrecognized recurrence', () => {
    assert.equal(computeNextDueDate('One time', '2026-06-01'), null);
    assert.equal(computeNextDueDate('', '2026-06-01'), null);
    assert.equal(computeNextDueDate('Weekly', '2026-06-01'), null);
  });

  await test('computeNextDueDate computes monthly from completedAt', () => {
    const result = computeNextDueDate('Monthly', '2026-06-01');
    assert.equal(result, '2026-07-01');
  });

  await test('computeNextDueDate computes 90-day interval from completedAt', () => {
    const result = computeNextDueDate('Every 90 days', '2026-04-01T12:00:00Z');
    assert.equal(result, '2026-06-30');
  });

  await test('computeNextDueDate computes twice-a-year from completedAt', () => {
    const result = computeNextDueDate('Twice a year', '2026-01-01T12:00:00Z');
    assert.equal(result, '2026-07-02');
  });

  await test('computeNextDueDate computes yearly from completedAt', () => {
    const result = computeNextDueDate('Yearly', '2026-06-15T12:00:00Z');
    assert.equal(result, '2027-06-15');
  });

  await test('getTaskStateForDate returns overdue for past dates', () => {
    assert.equal(getTaskStateForDate('2000-01-01'), 'overdue');
    assert.equal(getTaskStateForDate('2020-12-31'), 'overdue');
  });

  await test('getTaskStateForDate returns upcoming for future dates', () => {
    assert.equal(getTaskStateForDate('2099-01-01'), 'upcoming');
    assert.equal(getTaskStateForDate('2050-06-15'), 'upcoming');
  });

  await test('getTaskStateForDate returns due_today for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(getTaskStateForDate(today), 'due_today');
  });

  await test('formatCurrency formats whole dollar amounts without cents', () => {
    assert.equal(formatCurrency(10000), '$100');
    assert.equal(formatCurrency(100), '$1');
    assert.equal(formatCurrency(0), '$0');
  });

  await test('formatCurrency formats amounts with cents', () => {
    assert.equal(formatCurrency(10099), '$100.99');
    assert.equal(formatCurrency(149), '$1.49');
    assert.equal(formatCurrency(1), '$0.01');
  });

  await test('formatCurrency handles large amounts', () => {
    assert.equal(formatCurrency(1000000), '$10,000');
    assert.equal(formatCurrency(1000050), '$10,000.50');
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function test(name: string, run: () => void | Promise<void>) {
  try {
    await run();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}
