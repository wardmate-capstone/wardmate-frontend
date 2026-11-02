// Local validation only: no login, tokens, response fixtures or network requests.
// Run: node tests/staffing-validation-check.mjs
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false, logLevel: 'error',
  cacheDir: 'test-results/.vite-staffing-validation',
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { middlewareMode: true, watch: null, hmr: false },
});
let checks = 0;
const check = (label, actual, expected) => { assert.equal(actual, expected, label); checks++; };
try {
  const { staffingFormSchema, validStaffingRange, validatePeriod, vietnamIso } = await server.ssrLoadModule('/src/lib/staffingValidation.ts');
  const { closureInputSchema, closureReasonSchema, calendarClosuresApi } = await server.ssrLoadModule('/src/lib/api/calendarClosures.ts');
  const { api } = await server.ssrLoadModule('/src/lib/api/index.ts');
  const { vietnamToday, addCalendarDays } = await server.ssrLoadModule('/src/lib/calendarRules.ts');
  let networkAttempts = 0;
  api.interceptors.request.use(() => { networkAttempts++; throw new Error('Network is forbidden in validation checks.'); });

  const now = Date.parse('2026-11-01T00:00:00Z');
  const period = (start, end, shift = false) => validatePeriod({ startsAt: start, endsAt: end }, shift, now);
  check('valid future shift', period('2026-11-02T08:00', '2026-11-02T16:30', true), undefined);
  check('24-hour shift allowed', period('2026-11-02T08:00', '2026-11-03T08:00', true), undefined);
  check('shift longer than 24 hours blocked', Boolean(period('2026-11-02T08:00', '2026-11-03T08:01', true)), true);
  check('shift in past blocked', Boolean(period('2026-10-31T08:00', '2026-11-01T10:00', true)), true);
  check('ongoing leave allowed', period('2026-10-31T08:00', '2026-11-02T10:00'), undefined);
  check('finished leave blocked', Boolean(period('2026-10-30T08:00', '2026-10-31T10:00')), true);
  check('equal times blocked', Boolean(period('2026-11-02T08:00', '2026-11-02T08:00')), true);
  check('reversed times blocked', Boolean(period('2026-11-02T09:00', '2026-11-02T08:00')), true);
  check('93-day leave allowed', period('2026-11-02T08:00', '2027-02-03T08:00'), undefined);
  check('leave over 93 days blocked', Boolean(period('2026-11-02T08:00', '2027-02-03T08:01')), true);
  for (const invalid of ['2026-02-30T08:00', '2026-04-31T08:00', '0000-01-01T08:00', '2026-11-02T24:00', '2026-11-02T08:60', '2026-11-02', '2026-11-02T08:00Z', '']) {
    check(`invalid datetime rejected: ${invalid}`, Boolean(period(invalid, '2026-11-03T08:00')), true);
    assert.throws(() => vietnamIso(invalid)); checks++;
  }
  for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
    process.env.TZ = timezone;
    check(`Vietnam ISO independent of ${timezone}`, vietnamIso('2026-11-02T08:00'), '2026-11-02T01:00:00.000Z');
  }
  check('one-day staffing range', validStaffingRange('2026-11-01', '2026-11-01'), true);
  check('93 inclusive staffing days', validStaffingRange('2026-11-01', '2027-02-01'), true);
  check('94 inclusive staffing days blocked', validStaffingRange('2026-11-01', '2027-02-02'), false);
  check('normalized nonexistent date blocked', validStaffingRange('2026-02-30', '2026-03-01'), false);

  const select = options => staffingFormSchema([{ name: 'officerId', type: 'select', options }]);
  check('enabled selection allowed', select([{ value: 'enabled' }]).safeParse({ officerId: 'enabled' }).success, true);
  check('disabled selection blocked', select([{ value: 'disabled', disabled: true }]).safeParse({ officerId: 'disabled' }).success, false);
  check('missing selection blocked', select([]).safeParse({ officerId: 'old' }).success, false);
  check('selection removed after refresh blocked', select([{ value: 'new' }]).safeParse({ officerId: 'old' }).success, false);
  check('empty selection blocked', select([{ value: 'enabled' }]).safeParse({ officerId: '' }).success, false);
  check('assignment reason trim', staffingFormSchema([{ name: 'reason', max: 470 }]).parse({ reason: '  Lý do  ' }).reason, 'Lý do');
  check('assignment reason boundary', staffingFormSchema([{ name: 'reason', max: 470 }]).safeParse({ reason: 'a'.repeat(470) }).success, true);
  check('assignment reason overflow', staffingFormSchema([{ name: 'reason', max: 470 }]).safeParse({ reason: 'a'.repeat(471) }).success, false);
  check('empty reason blocked', closureReasonSchema.safeParse(' \n\t ').success, false);
  check('closure reason 500 allowed', closureReasonSchema.safeParse('a'.repeat(500)).success, true);
  check('closure reason 501 blocked', closureReasonSchema.safeParse('a'.repeat(501)).success, false);
  check('trim before closure length', closureReasonSchema.parse(`  ${'a'.repeat(500)}  `).length, 500);
  const today = vietnamToday();
  check('closure date today allowed', closureInputSchema.safeParse({ date: today, reason: 'Ngày nghỉ' }).success, true);
  check('closure date +366 allowed', closureInputSchema.safeParse({ date: addCalendarDays(today, 366), reason: 'Ngày nghỉ' }).success, true);
  check('closure date +367 blocked', closureInputSchema.safeParse({ date: addCalendarDays(today, 367), reason: 'Ngày nghỉ' }).success, false);
  check('closure date yesterday blocked', closureInputSchema.safeParse({ date: addCalendarDays(today, -1), reason: 'Ngày nghỉ' }).success, false);
  check('closure date impossible blocked', closureInputSchema.safeParse({ date: '2027-02-29', reason: 'Ngày nghỉ' }).success, false);
  for (const call of [
    () => calendarClosuresApi.list('2026-02-30', '2026-03-01'),
    () => calendarClosuresApi.create({ date: today, reason: ' ' }, false),
    () => calendarClosuresApi.create({ date: addCalendarDays(today, 367), reason: 'Ngày nghỉ' }, true),
    () => calendarClosuresApi.cancel('not-a-uuid', 'Lý do'),
    () => calendarClosuresApi.cancel('00000000-0000-0000-0000-000000000000', ' '),
  ]) { await assert.rejects(call); checks++; }
  check('invalid API input never reached HTTP transport', networkAttempts, 0);
  console.log(`${checks}/${checks} staffing/form validation checks passed; 0 network requests.`);
} finally {
  await server.close();
}
