// Node unit test for the savings-counter formatter.
// Run from repo root:  node tests/test_savings_counter_render.js
// No DOM, no network: we stub the element's getAttribute.

const path = require('path');
const { formatCounterLine } = require(path.join(__dirname, '..', 'static', 'savings-counter.js'));

const failures = [];
function check(cond, msg) { if (!cond) failures.push(msg); }

// Stub element returning the English templates the build would emit.
const ATTRS = {
  'data-hours-template': 'saved ~{hours} hours',
  'data-money-template': '~${dollars}',
  'data-joiner': 'and',
  'data-suffix': 'of agent work',
  'data-approx': '~',
};
const el = { getAttribute: (k) => (k in ATTRS ? ATTRS[k] : null) };

// 1. Full payload -> hours + dollars + suffix, numbers wrapped, dollars 2dp.
const full = formatCounterLine(
  { total_minutes_saved: 18240, total_tokens_saved: 412000000, total_usd_saved: 8.24, event_count: 1530 },
  el
);
check(full !== null, 'full payload should render a line');
check(full.indexOf('304') !== -1, 'hours should be 18240/60 = 304 (got: ' + full + ')');
check(full.indexOf('8.24') !== -1, 'dollars should render as 8.24');
check(full.indexOf('of agent work') !== -1, 'suffix should be present');
check(full.indexOf('and') !== -1, 'joiner should be present when money exists');
check(full.indexOf('savings-counter__num') !== -1, 'numbers should be wrapped in the num span');

// 2. Empty payload (zero events) -> null (counter stays hidden).
const empty = formatCounterLine(
  { total_minutes_saved: 0, total_tokens_saved: 0, total_usd_saved: 0, event_count: 0 },
  el
);
check(empty === null, 'zero-event payload should return null (stay hidden)');

// 3. Minutes but no money -> hours clause only, no joiner, no dollar sign.
const noMoney = formatCounterLine(
  { total_minutes_saved: 600, total_tokens_saved: 5000000, total_usd_saved: null, event_count: 12 },
  el
);
check(noMoney !== null, 'minutes-only payload should render');
check(noMoney.indexOf('10') !== -1, 'hours should be 600/60 = 10');
check(noMoney.indexOf('$') === -1, 'no dollar sign when usd is null');
check(noMoney.indexOf(' and ') === -1, 'no joiner when money is absent');

// 4. Garbage / missing payload -> null.
check(formatCounterLine(null, el) === null, 'null payload -> null');
check(formatCounterLine({}, el) === null, 'empty object -> null');

if (failures.length) {
  console.log('FAIL');
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
console.log('PASS: savings-counter formatter unit test green');
