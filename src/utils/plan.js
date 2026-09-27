import { PPCT, PRACTICE_LESSON, gradeOf, isPractice } from "../data/ppct.js";
import { DAYS, SESSIONS, slotKey } from "../data/defaultState.js";
import { parseDate, addDays } from "./date.js";
import { defaultNames, formatMaterials, orderByList, overrideNames, sameSet } from "./materials.js";

// Thứ Hai của tuần: mặc định = tuần trước + 7 ngày, trừ khi tuần đó được đặt ngày riêng (ví dụ sau Tết)
export function mondayOf(state, week) {
  let m = parseDate(state.config.week1 || "2026-09-07");
  for (let k = 1; k <= week; k++) {
    const custom = state.weeks[k] && state.weeks[k].monday;
    if (k > 1) m = addDays(m, 7);
    if (custom) m = parseDate(custom);
  }
  return m;
}

// Lập danh sách tiết dạy của một tuần từ thời khóa biểu + PPCT + các ô sửa tay
export function buildRows(state, week) {
  const cfg = state.config;
  const ov = (state.weeks[week] && state.weeks[week].ov) || {};
  const monday = mondayOf(state, week);
  const offsets = {};
  cfg.classes.forEach((c) => (offsets[c.name] = Number(c.offset) || 0));

  const defaultMaterials = defaultNames(cfg);
  const count = {};
  const rows = [];
  DAYS.forEach((_, d) =>
    SESSIONS.forEach((s) => {
      for (let t = 1; t <= s.periods; t++) {
        const key = slotKey(d, s.key, t);
        const cls = cfg.timetable[key];
        if (!cls) continue;

        count[cls] = (count[cls] || 0) + 1;
        const g = gradeOf(cls);
        const practice = isPractice(cls);
        const o = ov[key] || {};
        // Tiết PPCT tự động = số tiết các tuần trước + thứ tự lần gặp lớp trong tuần + số tiết lệch
        const autoPpct = g ? (week - 1) * PPCT[g].perWeek + count[cls] + (offsets[cls] || 0) : null;
        const hasPpctOv = o.ppct != null && o.ppct !== "";
        const ppct = hasPpctOv ? Number(o.ppct) : autoPpct;
        const item = g && ppct >= 1 ? PPCT[g].items[ppct - 1] : null;
        const auto = {
          // Kế hoạch dùng tên gọn "Unit 1: Lesson 1 (1,2)"; bảng PPCT vẫn giữ tên đầy đủ
          lesson: practice ? PRACTICE_LESSON : item ? item.short || item.name : "",
          nls: item ? item.nls : "",
          materials: defaultMaterials,
        };

        // Đồ dùng: mảng tên đã chọn; chuỗi gõ tay kiểu cũ được giữ nguyên khi xuất file
        const matOv = o.materials;
        const materials = matOv == null ? defaultMaterials : orderByList(overrideNames(matOv), cfg.materialList);

        rows.push({
          key,
          d,
          date: addDays(monday, d),
          session: s.key,
          sessionLabel: s.label,
          period: t,
          cls,
          grade: g,
          practice,
          autoPpct,
          auto,
          ppct: ppct == null ? "" : ppct,
          lesson: o.lesson ?? auto.lesson,
          nls: o.nls ?? auto.nls,
          materials,
          materialsText: typeof matOv === "string" ? matOv : formatMaterials(materials),
          edited: { ppct: hasPpctOv, lesson: o.lesson != null, nls: o.nls != null, materials: matOv != null && !sameSet(materials, defaultMaterials) },
          outOfRange: !!g && (ppct < 1 || ppct > PPCT[g].items.length),
        });
      }
    })
  );
  return rows;
}

export function weekRange(rows, state, week) {
  const m = mondayOf(state, week);
  if (!rows.length) return { from: m, to: addDays(m, 4) };
  return { from: rows[0].date, to: rows[rows.length - 1].date };
}

// Nhóm theo ngày rồi theo buổi để gộp ô khi hiển thị và khi xuất file
export function groupRows(rows) {
  const days = [];
  rows.forEach((r) => {
    let day = days.find((x) => x.d === r.d);
    if (!day) days.push((day = { d: r.d, date: r.date, sessions: [] }));
    let s = day.sessions.find((x) => x.session === r.session);
    if (!s) day.sessions.push((s = { session: r.session, label: r.sessionLabel, rows: [] }));
    s.rows.push(r);
  });
  return days;
}
