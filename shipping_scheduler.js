const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calculateShippingDate(orderDatetime, holidays, options = {}) {
  const cutoffHHMM = options.cutoffHHMM ?? '12:00';
  const returnMode = options.return ?? 'iso';

  const dt = normalizeToUTC(orderDatetime); 
  const dOnly = toUtcDateOnly(dt);         
  const holidaySet = new Set((holidays || []).map(String)); 

  const cutoffMinutes = parseCutoffToMinutes(cutoffHHMM);
  const tMinutes = dt.getUTCHours() * 60 + dt.getUTCMinutes();

  const beforeCutoff = tMinutes < cutoffMinutes;
  const afterCutoff = tMinutes > cutoffMinutes;
  const isBusinessToday = isBusinessDay(dOnly, holidaySet);

  if (isLastFriday(dOnly) && afterCutoff) {
    const nextMon = nextWeekday(dOnly, 1); 
    const ship = rollForwardToBusinessDay(nextMon, holidaySet);
    return returnMode === 'date' ? ship : isoDate(ship);
  }

  let candidate = null;
  if (isBusinessToday && beforeCutoff) {
    candidate = dOnly; 
  } else {
    candidate = addDays(dOnly, 1);
  }

  const shipDate = rollForwardToBusinessDay(candidate, holidaySet);
  return returnMode === 'date' ? shipDate : isoDate(shipDate);
}


function normalizeToUTC(input) {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) throw new TypeError('Invalid Date');
    return new Date(input.getTime());
  }
  if (typeof input === 'string') {
    let s = input.trim();
    const hasTZ = /(?:Z|[+\-]\d{2}:?\d{2})$/i.test(s);
    if (hasTZ) {
      const d = new Date(s);
      if (isNaN(d.getTime())) throw new TypeError('Invalid date string');
      return d;
    }
    const m = s.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (!m) throw new TypeError('Unsupported date format');
    const [ , Y, M, D, hh='00', mm='00', ss='00' ] = m;
    const ms = Date.UTC(+Y, +M - 1, +D, +hh, +mm, +ss);
    return new Date(ms);
  }
  throw new TypeError('orderDatetime must be Date or string');
}

function toUtcDateOnly(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function parseCutoffToMinutes(hhmm) {
  const m = hhmm.match(/^(\d{2}):(\d{2})$/);
  if (!m) throw new Error('cutoffHHMM must be HH:MM');
  const [, hh, mm] = m;
  const H = +hh, M = +mm;
  if (H < 0 || H > 23 || M < 0 || M > 59) throw new Error('Invalid cutoff time');
  return H * 60 + M;
}

function addDays(d, n) {
  return new Date(d.getTime() + n * MS_PER_DAY);
}

function isWeekend(d) {
  const dow = d.getUTCDay(); 
  return dow === 0 || dow === 6;
}

function isBusinessDay(d, holidaySet) {
  return !isWeekend(d) && !holidaySet.has(isoDate(d));
}

function rollForwardToBusinessDay(d, holidaySet) {
  let cur = d;
  while (!isBusinessDay(cur, holidaySet)) {
    cur = addDays(cur, 1);
  }
  return cur;
}

function lastDayOfMonthUTC(d) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return new Date(Date.UTC(y, m + 1, 0)); 
}

function lastFridayOfMonthUTC(d) {
  const last = lastDayOfMonthUTC(d);
  const dow = last.getUTCDay(); 
  const offset = (dow - 5 + 7) % 7;
  return addDays(last, -offset);
}

function isLastFriday(d) {
  const lf = lastFridayOfMonthUTC(d);
  return lf.getUTCFullYear() === d.getUTCFullYear() &&
         lf.getUTCMonth() === d.getUTCMonth() &&
         lf.getUTCDate() === d.getUTCDate();
}

function nextWeekday(d, targetDow ) {
  const cur = d.getUTCDay();
  let delta = (targetDow - cur + 7) % 7;
  if (delta === 0) delta = 7; 
  return addDays(d, delta);
}

module.exports = {
  calculateShippingDate,

  _internals: {
    normalizeToUTC,
    isLastFriday,
    rollForwardToBusinessDay,
    parseCutoffToMinutes,
    isoDate,
  }
};
