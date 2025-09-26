# shipping-scheduler
Shipping Date & Holiday-Aware Scheduler — Logic Overview

Goal: Given an order timestamp and a list of holiday dates (YYYY-MM-DD), compute the shipping date (not time) respecting special rules, weekends, holidays, and a configurable cut-off.

Business rules implemented

Last Friday rule (strictly after cut-off):
If the order is placed on the last Friday of the month after the cut-off time (default 12:00), ship on the following Monday.
If that Monday is a holiday (or weekend), roll forward to the next business day.

Normal orders:

Before cut-off → same day (only if it’s a business day).

At or after cut-off → next business day.

No shipments on Saturdays, Sundays, or holidays. If a computed date lands on a non-business day, roll forward.

Timezone & inputs

All computations are done in UTC.

If the input is a naive string (no Z or offset), it’s assumed UTC.

If the input has Z/±HH:MM, it’s parsed as such and normalized to UTC.

Algorithm (high level)

Normalize orderDatetime to a UTC Date. Extract the UTC date (midnight).

Parse cutoffHHMM into UTC minutes (e.g., 12:00 → 720).

Build a holiday set (YYYY-MM-DD strings).

If last Friday and strictly after cut-off → candidate = next Monday.

Else normal rule:

If business day and before cut-off → candidate = same day.

Otherwise → candidate = next day.

Roll forward: while candidate is weekend/holiday, move to the next day.

Return ISO date (default) or Date per options.

Edge cases handled

Exactly at cut-off (e.g., 12:00) is treated as not before → counts as at/after → next business day.
(For Last Friday rule we require strictly after cut-off, per spec.)

Monday holiday after last Friday → roll to Tuesday (or further if needed).

End-of-month and leap years via UTC calendar math (last day of month + step back to Friday).

Weekend orders behave like “not a business day” → fall into next day then roll forward.

