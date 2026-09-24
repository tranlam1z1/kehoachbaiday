import { Fragment } from "react";
import { DAYS, SESSIONS, slotKey } from "../data/defaultState.js";
import { PPCT, gradeOf } from "../data/ppct.js";

export default function TimetableTab({ state, update }) {
  const { timetable, classes } = state.config;
  const names = classes.map((c) => c.name);

  const setSlot = (key, value) =>
    update((s) => {
      if (value) s.config.timetable[key] = value;
      else delete s.config.timetable[key];
    });

  const count = {};
  Object.values(timetable).forEach((c) => c && (count[c] = (count[c] || 0) + 1));

  return (
    <section>
      <p className="hint">
        Chọn lớp cho từng tiết. Kế hoạch mỗi tuần được lập từ thời khóa biểu này: lớp nào gặp lần đầu trong tuần sẽ học
        tiết PPCT tiếp theo, rồi đến tiết sau.
      </p>
      <div className="scroll">
        <table className="tt">
          <thead>
            <tr>
              <th />
              {DAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SESSIONS.map((s, si) => (
              <Fragment key={s.key}>
                {Array.from({ length: s.periods }, (_, idx) => {
                  const t = idx + 1;
                  return (
                    <tr key={t} className={si === 1 && t === 1 ? "split" : ""}>
                      <th className="rowh">
                        <b>{s.label}</b> tiết {t}
                      </th>
                      {DAYS.map((dayLabel, d) => {
                        const key = slotKey(d, s.key, t);
                        const v = timetable[key] || "";
                        const opts = v && !names.includes(v) ? [...names, v] : names;
                        return (
                          <td key={key}>
                            <select
                              className={v ? "has" : ""}
                              value={v}
                              aria-label={`${dayLabel} ${s.label} tiết ${t}`}
                              onChange={(e) => setSlot(key, e.target.value)}
                            >
                              <option value="">–</option>
                              {opts.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="chips">
        {names.map((n) => {
          const g = gradeOf(n);
          const need = g ? PPCT[g].perWeek : null;
          const have = count[n] || 0;
          const warn = need != null && have !== need;
          return (
            <span key={n} className={`chip${warn ? " warn" : ""}`} title={warn ? `PPCT khối ${g}: ${need} tiết/tuần` : undefined}>
              {n}: {have} tiết{warn ? ` (cần ${need})` : ""}
            </span>
          );
        })}
      </div>
    </section>
  );
}
