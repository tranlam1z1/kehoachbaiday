import { useEffect, useState } from "react";
import { ddmmyyyy } from "../utils/date.js";

const SCOPES = [
  { value: "week", label: "Tuần đang xem" },
  { value: "range", label: "Từ tuần … đến tuần …" },
  { value: "hk1", label: "Học kì I" },
  { value: "hk2", label: "Học kì II" },
  { value: "year", label: "Cả năm" },
];

// Bấm nút giao diện để đổi lần lượt: tự động -> sáng -> tối
const THEMES = {
  auto: { icon: "◐", label: "Tự động", next: "light" },
  light: { icon: "☀", label: "Sáng", next: "dark" },
  dark: { icon: "☾", label: "Tối", next: "auto" },
};

export default function Header({ config, week, maxWeek, range, onWeekChange, scope, onScopeChange, onExportWord, onExportExcel, theme, onThemeChange }) {
  const th = THEMES[theme] || THEMES.auto;
  const setScope = (patch) => onScopeChange({ ...scope, ...patch });

  const [draft, setDraft] = useState(String(week));
  useEffect(() => setDraft(String(week)), [week]);

  return (
    <header className="sheet">
      <button
        type="button"
        className="theme-btn"
        aria-label={`Giao diện: ${th.label}. Bấm để chuyển sang ${THEMES[th.next].label.toLowerCase()}.`}
        title={theme === "auto" ? "Tự động theo cài đặt sáng/tối của máy" : undefined}
        onClick={() => onThemeChange(th.next)}
      >
        <span aria-hidden="true">{th.icon}</span> {th.label}
      </button>
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
          <div className="scope">
            <select value={scope.mode} aria-label="Phạm vi xuất" onChange={(e) => setScope({ mode: e.target.value })}>
              {SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {scope.mode === "range" && (
              <span className="scope-range">
                từ
                <input type="number" min="1" max={maxWeek} value={scope.from} aria-label="Từ tuần" onChange={(e) => setScope({ from: e.target.value })} />
                đến
                <input type="number" min="1" max={maxWeek} value={scope.to} aria-label="Đến tuần" onChange={(e) => setScope({ to: e.target.value })} />
              </span>
            )}
          </div>
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
