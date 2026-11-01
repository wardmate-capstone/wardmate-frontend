// Pure date-boundary checks. No accounts, tokens, API responses or business records.
// Run: node --experimental-strip-types tests/calendar-rules-check.mjs
import assert from 'node:assert/strict';
import { addCalendarDays, canCancelClosure, validCalendarDate, validClosureDate, validClosureRange, vietnamToday } from '../src/lib/calendarRules.ts';

let checks = 0;
function check(label, actual, expected) {
  assert.equal(actual, expected, label);
  checks++;
}

for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
  process.env.TZ = timezone;
  check(`${timezone}: before Vietnam midnight`, vietnamToday(new Date('2026-11-01T16:59:59Z')), '2026-11-01');
  check(`${timezone}: after Vietnam midnight`, vietnamToday(new Date('2026-11-01T17:00:00Z')), '2026-11-02');
}
check('leap date accepted', validCalendarDate('2028-02-29'), true);
for (const invalid of ['0000-01-01', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '', '2026-1-01', '2026-11-01T00:00:00Z']) {
  check(`reject invalid date: ${invalid}`, validCalendarDate(invalid), false);
}
check('one-day view allowed', validClosureRange('2026-11-01', '2026-11-01'), true);
check('exactly 400 inclusive days allowed', validClosureRange('2026-11-01', addCalendarDays('2026-11-01', 399)), true);
check('401 inclusive days rejected', validClosureRange('2026-11-01', addCalendarDays('2026-11-01', 400)), false);
check('reversed range rejected', validClosureRange('2026-11-02', '2026-11-01'), false);
check('invalid endpoint rejected', validClosureRange('2026-02-29', '2026-03-01'), false);
check('missing endpoint rejected', validClosureRange('2026-11-01', ''), false);
check('today can be declared', validClosureDate('2026-11-01', '2026-11-01'), true);
check('yesterday cannot be declared', validClosureDate('2026-10-31', '2026-11-01'), false);
check('day +366 allowed', validClosureDate(addCalendarDays('2026-11-01', 366), '2026-11-01'), true);
check('day +367 rejected', validClosureDate(addCalendarDays('2026-11-01', 367), '2026-11-01'), false);
check('invalid creation date rejected', validClosureDate('2027-02-29', '2026-11-01'), false);
check('tomorrow can be cancelled', canCancelClosure('2026-11-02', false, '2026-11-01'), true);
check('today cannot be cancelled', canCancelClosure('2026-11-01', false, '2026-11-01'), false);
check('yesterday cannot be cancelled', canCancelClosure('2026-10-31', false, '2026-11-01'), false);
check('already cancelled cannot be cancelled', canCancelClosure('2026-11-02', true, '2026-11-01'), false);
check('midnight revokes cancellation', canCancelClosure('2026-11-02', false, '2026-11-02'), false);
check('leap day offset', addCalendarDays('2028-02-28', 1), '2028-02-29');
console.log(`${checks}/${checks} calendar date-boundary checks passed; 0 API requests.`);
