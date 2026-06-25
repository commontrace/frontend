// CommonTrace — Global savings counter
// Fetches anonymized global sums and renders
// "the commons has saved ~N hours and ~$M of agent work".
//
// No LLM is involved: every number is a real measured count summed
// server-side (minutes, tokens) or money = tokens x a published price
// constant computed server-side. This script only formats and displays.
//
// Graceful empty-state: on zero events, error, or unreachable endpoint
// the counter element stays hidden (it ships hidden in the markup).
(function () {
  'use strict';

  var API = 'https://api.commontrace.org/api/v1/analytics';

  // Exposed for unit testing under Node; harmless in the browser.
  function formatCounterLine(data, el) {
    if (!data || typeof data !== 'object') return null;
    var events = Number(data.event_count) || 0;
    var minutes = Number(data.total_minutes_saved) || 0;
    // Nothing real to show -> caller leaves the counter hidden.
    if (events <= 0 || minutes <= 0) return null;

    var hoursTpl = el.getAttribute('data-hours-template') || 'saved ~{hours} hours';
    var moneyTpl = el.getAttribute('data-money-template') || '~${dollars}';
    var joiner = el.getAttribute('data-joiner') || 'and';
    var suffix = el.getAttribute('data-suffix') || 'of agent work';

    var hours = Math.round(minutes / 60);
    if (hours <= 0) return null;
    var hoursStr = hours.toLocaleString();
    var hoursClause = hoursTpl.replace('{hours}', '<span class="savings-counter__num">' + hoursStr + '</span>');

    var parts = [hoursClause];

    // Money is optional: render it only when the server supplied a real figure.
    var usd = data.total_usd_saved;
    if (usd !== null && usd !== undefined && !isNaN(Number(usd)) && Number(usd) > 0) {
      var usdStr = Number(usd).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      var moneyClause = moneyTpl.replace('{dollars}', '<span class="savings-counter__num">' + usdStr + '</span>');
      parts.push(joiner);
      parts.push(moneyClause);
    }

    parts.push(suffix);
    return parts.join(' ');
  }

  function render(data) {
    var el = document.getElementById('savings-counter');
    if (!el) return;
    var line = formatCounterLine(data, el);
    if (line === null) return; // stay hidden
    var lineEl = document.getElementById('savings-counter-line');
    if (lineEl) lineEl.innerHTML = line;
    el.removeAttribute('hidden');
  }

  function load() {
    if (!document.getElementById('savings-counter')) return;
    fetch(API + '/savings', { headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(render)
      .catch(function () {
        // Offline / 404 / 5xx: leave the counter hidden, never show a broken figure.
      });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formatCounterLine: formatCounterLine };
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
