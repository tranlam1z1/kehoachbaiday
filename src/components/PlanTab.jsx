import { Fragment, useCallback, useState } from "react";
import { DAYS } from "../data/defaultState.js";
import { groupRows, mondayOf } from "../utils/plan.js";
import { ddmm, parseDate, toIso } from "../utils/date.js";
import EditableCell from "./EditableCell.jsx";
import MaterialsPicker, { MaterialsCell } from "./MaterialsPicker.jsx";
import { defaultNames, sameName, setSlotMaterials } from "../utils/materials.js";

const ensureWeek = (s, week) => (s.weeks[week] ||= { monday: "", ov: {} });

export default function PlanTab({ state, week, maxWeek, rows, update, notify, saved }) {
  const days = groupRows(rows);
  const overrides = (state.weeks[week] && state.weeks[week].ov) || {};
  const [picking, setPicking] = useState(null); // khóa tiết đang mở hộp thoại chọn đồ dùng
  const closePicker = useCallback(() => setPicking(null), []);
  const pickingRow = rows.find((r) => r.key === picking);

  function commit(row, field, raw) {
    const val = raw.trim();
    if (field === "ppct" && val !== "" && !/^\d+$/.test(val)) {
      notify("Tiết PPCT phải là một số.");
      return false;
    }
    update((s) => {
      const w = ensureWeek(s, week);
      w.ov ||= {};
      const o = { ...(w.ov[row.key] || {}) };
      if (field === "ppct") {
        if (val === "" || Number(val) === row.autoPpct) delete o.ppct;
        else o.ppct = Number(val);
        // Đổi số tiết thì tên bài và mã NLS đi theo PPCT mới
        delete o.lesson;
        delete o.nls;
      } else if (val !== "" && val !== row.auto[field]) {
        o[field] = val;
      } else {
        delete o[field];
      }
      if (Object.keys(o).length) w.ov[row.key] = o;
      else delete w.ov[row.key];
    });
  }

  // Phạm vi áp dụng đồ dùng khi chọn cho một tiết. Thời khóa biểu giống nhau mọi tuần nên
  // "cả năm" = các tiết của tuần đang xem, lặp lại ở tuần 1 đến tuần cuối
  function materialScopes(row) {
    const sessionRows = rows.filter((x) => x.d === row.d && x.session === row.session);
    const all = Array.from({ length: maxWeek }, (_, i) => i + 1);
    return [
      { value: "one", label: "Chỉ tiết này", targets: [[week, [row.key]]] },
      { value: "session", label: `Các tiết cùng buổi (${sessionRows.length} tiết)`, targets: [[week, sessionRows.map((x) => x.key)]] },
      { value: "week", label: `Cả tuần ${week} (${rows.length} tiết)`, targets: [[week, rows.map((x) => x.key)]] },
      { value: "year", label: `Cả năm học, tuần 1–${maxWeek} (${rows.length * maxWeek} tiết)`, targets: all.map((w) => [w, rows.map((x) => x.key)]) },
    ];
  }

  // Đồ dùng cho các tiết trong phạm vi đã chọn; toAdd = đồ dùng riêng cần lưu thêm vào danh sách
  function commitMaterials(scope, names, toAdd) {
    setPicking(null);
    update((s) => {
      const list = s.config.materialList;
      toAdd.forEach((name) => !list.some((m) => sameName(m.name, name)) && list.push({ name, isDefault: false }));
      scope.targets.forEach(([w, keys]) => keys.forEach((key) => setSlotMaterials(s, w, key, names)));
    });
    const n = scope.targets.reduce((a, [, keys]) => a + keys.length, 0);
    if (n > 1) notify(`Đã áp dụng đồ dùng cho ${n} tiết.`);
  }

  function changeMonday(v) {
    if (!v) return;
    update((s) => {
      const w = ensureWeek(s, week);
      w.monday = "";
      const auto = toIso(mondayOf(s, week));
      w.monday = v === auto ? "" : v;
    });
    if (parseDate(v).getUTCDay() !== 1) notify("Ngày đã chọn không phải thứ Hai. Kế hoạch vẫn tính ngày đầu tuần là ngày này.");
  }

  function resetWeek() {
    if (!Object.keys(overrides).length) return notify("Tuần này chưa có ô nào sửa tay.");
    update((s) => {
      ensureWeek(s, week).ov = {};
    });
    notify(`Đã khôi phục tuần ${week} theo PPCT.`);
  }

  const notes = [];
  const unknown = [...new Set(rows.filter((r) => !r.grade && !r.practice).map((r) => r.cls))];
  if (unknown.length) notes.push(`Chưa có PPCT cho ${unknown.join(", ")}. Cô có thể gõ tên bài trực tiếp.`);
  const over = [...new Set(rows.filter((r) => r.outOfRange).map((r) => r.cls))];
  if (over.length)
    notes.push(`${over.join(", ")} đã vượt quá số tiết trong PPCT ở tuần này. Kiểm tra lại số tuần hoặc số tiết lệch của lớp.`);

  return (
    <section>
      <div className="toolbar">
        <label>
          Thứ Hai của tuần này
          <input type="date" value={toIso(mondayOf(state, week))} onChange={(e) => changeMonday(e.target.value)} />
        </label>
        <button className="btn small ghost" onClick={resetWeek}>
          Khôi phục theo PPCT
        </button>
        <span className="status">{saved ? "Đã lưu trên trình duyệt này" : "Đang lưu…"}</span>
      </div>

      <div className="scroll">
        <table className="plan">
          <thead>
            <tr>
              <th>Thứ ngày</th>
              <th>Buổi</th>
              <th>Tiết</th>
              <th>Lớp</th>
              <th>Tên bài dạy</th>
              <th>Tiết PPCT</th>
              <th>Đồ dùng dạy học</th>
              <th>Nội dung tích hợp</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && (
              <tr>
                <td colSpan={8} className="empty">
                  Thời khóa biểu đang trống. Mở thẻ Thời khóa biểu để chọn lớp cho từng tiết.
                </td>
              </tr>
            )}
            {days.map((day) => {
              const dayCount = day.sessions.reduce((a, s) => a + s.rows.length, 0);
              let first = true;
              return (
                <Fragment key={day.d}>
                  {day.sessions.map((s) =>
                    s.rows.map((r, i) => {
                      const showDay = first;
                      first = false;
                      return (
                        <tr key={r.key}>
                          {showDay && (
                            <td className="day" rowSpan={dayCount}>
                              {DAYS[day.d]}
                              <small>{ddmm(day.date)}</small>
                            </td>
                          )}
                          {i === 0 && (
                            <td className="center" rowSpan={s.rows.length}>
                              {s.label}
                            </td>
                          )}
                          <td className="center">{r.period}</td>
                          <td className="center cls">{r.cls}</td>
                          <EditableCell className="lesson" label="Tên bài dạy" value={r.lesson} edited={r.edited.lesson} onCommit={(v) => commit(r, "lesson", v)} />
                          <EditableCell className="ppct" label="Tiết PPCT" numeric value={r.ppct} edited={r.edited.ppct} onCommit={(v) => commit(r, "ppct", v)} />
                          <MaterialsCell row={r} onOpen={() => setPicking(r.key)} />
                          <EditableCell className="nls" label="Nội dung tích hợp" value={r.nls} edited={r.edited.nls} onCommit={(v) => commit(r, "nls", v)} />
                        </tr>
                      );
                    })
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="legend">
        Ô chữ <span>đỏ</span> là ô cô đã sửa tay. Sửa số tiết PPCT thì tên bài và mã NLS tự đổi theo. Bấm ô đồ dùng dạy học để chọn đồ dùng cho từng tiết.
      </p>
      {notes.length > 0 && (
        <ul className="notes">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {pickingRow && (
        <MaterialsPicker
          key={pickingRow.key}
          row={pickingRow}
          list={state.config.materialList}
          defaults={defaultNames(state.config)}
          scopes={materialScopes(pickingRow)}
          onSave={commitMaterials}
          onCancel={closePicker}
        />
      )}
    </section>
  );
}
