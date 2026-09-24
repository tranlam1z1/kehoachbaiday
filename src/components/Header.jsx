import { useEffect, useState } from "react";
import { ddmmyyyy } from "../utils/date.js";

export default function Header({ config, week, maxWeek, range, onWeekChange, onExportWord, onExportExcel }) {
  const [draft, setDraft] = useState(String(week));
  useEffect(() => setDraft(String(week)), [week]);

  return (
    <header className="sheet">
      <p className="school">
        {config.school}, năm học {config.year}
      </p>
      <div className="head-row">
        <h1>Kế hoạch giảng dạy</h1>
        <div className="week-nav" aria-label="Chọn tuần">
          <button className="icon-btn" aria-label="Tuần trước" disabled={week <= 1} onClick={() => onWeekChange(week - 1)}>
            ‹
          </button>
          <div className="wk">
            Tuần{" "}
            <input
              value={draft}
              inputMode="numeric"
              aria-label="Số tuần"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => onWeekChange(draft)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </div>
          <button className="icon-btn" aria-label="Tuần sau" disabled={week >= maxWeek} onClick={() => onWeekChange(week + 1)}>
            ›
          </button>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onExportWord}>
            Xuất Word
          </button>
          <button className="btn" onClick={onExportExcel}>
            Xuất Excel
          </button>
        </div>
      </div>
      <p className="range">
        Từ ngày {ddmmyyyy(range.from)} đến ngày {ddmmyyyy(range.to)}
      </p>
    </header>
  );
}
