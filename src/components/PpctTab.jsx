import { useState } from "react";
import { PPCT } from "../data/ppct.js";

const GRADES = Object.keys(PPCT).map(Number);

export default function PpctTab() {
  const [grade, setGrade] = useState(1);
  const P = PPCT[grade];
  const showNote = grade === 2;

  return (
    <section>
      <div className="toolbar">
        <div className="seg">
          {GRADES.map((g) => (
            <button key={g} aria-pressed={g === grade} onClick={() => setGrade(g)}>
              Lớp {g}
            </button>
          ))}
        </div>
        <span className="hint inline">
          {P.book}, {P.items.length} tiết, {P.perWeek} tiết mỗi tuần
        </span>
      </div>
      <div className="scroll">
        <table className="ppct-table">
          <thead>
            <tr>
              <th>Tuần</th>
              <th>Tiết</th>
              <th>Tên bài học</th>
              <th>Mã tích hợp NLS</th>
              {showNote && <th>Ghi chú</th>}
            </tr>
          </thead>
          <tbody>
            {P.items.map((it, i) => {
              const start = i % P.perWeek === 0;
              return (
                <tr key={i} className={start && i ? "wk-start" : ""}>
                  <td className="w">{start ? Math.floor(i / P.perWeek) + 1 : ""}</td>
                  <td className="t">{i + 1}</td>
                  <td>{it.name}</td>
                  <td>{it.nls}</td>
                  {showNote && <td>{it.note || ""}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
