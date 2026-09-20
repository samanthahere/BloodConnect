import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPATIBLE_DONORS, eligibleCutoffDate } from './bloodCompatibility.js';

test('O- patient can only receive from O-', () => {
  assert.deepEqual(COMPATIBLE_DONORS['O-'], ['O-']);
});

test('AB+ patient can receive from every group', () => {
  assert.equal(COMPATIBLE_DONORS['AB+'].length, 8);
});

test('A+ patient cannot receive from B or AB donors', () => {
  const donors = COMPATIBLE_DONORS['A+'];
  assert.ok(!donors.includes('B+'));
  assert.ok(!donors.includes('AB+'));
});

test('cutoff date is 90 days before today', () => {
  assert.equal(eligibleCutoffDate(new Date('2026-09-20')), '2026-06-22');
});