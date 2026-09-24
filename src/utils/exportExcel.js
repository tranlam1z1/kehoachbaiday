import * as XLSX from "xlsx";
import { DAYS_UPPER } from "../data/defaultState.js";
import { buildRows, weekRange, groupRows } from "./plan.js";
import { ddmm, ddmmyyyy } from "./date.js";
import { downloadBlob } from "./download.js";

// Dựng bảng dữ liệu (mảng 2 chiều) và danh sách ô gộp cho Excel
export function buildSheet(state, week) {
  const cfg = state.config;
  const rows = buildRows(state, week);
  const rg = weekRange(rows, state, week);
  const aoa = [];
  const merges = [];
  const merge = (r1, c1, r2, c2) => merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

  aoa.push([cfg.school, "", "", "", "", "", "", `Năm học: ${cfg.year}`]);
  merge(0, 0, 0, 4);
  aoa.push([`KẾ HOẠCH GIẢNG DẠY TUẦN ${week}`]);
  merge(1, 0, 1, 7);
  aoa.push([`(Từ ngày ${ddmmyyyy(rg.from)} đến ngày ${ddmmyyyy(rg.to)})`]);
  merge(2, 0, 2, 7);
  aoa.push([]);
  aoa.push(["Thứ ngày", "Buổi", "Tiết", "Lớp", "Tên bài dạy", "Tiết theo PPCT", "Đồ dùng dạy học", "Nội dung tích hợp"]);

  groupRows(rows).forEach((day) => {
    const dayStart = aoa.length;
    day.sessions.forEach((s) => {
      const sessionStart = aoa.length;
      s.rows.forEach((r, i) =>
        aoa.push([
          aoa.length === dayStart ? `${DAYS_UPPER[day.d]} ${ddmm(day.date)}` : "",
          i === 0 ? s.label : "",
          r.period,
          r.cls,
          r.lesson,
          r.ppct === "" ? "" : Number(r.ppct),
          r.materials,
          r.nls,
        ])
      );
      if (s.rows.length > 1) merge(sessionStart, 1, aoa.length - 1, 1);
    });
    if (aoa.length - dayStart > 1) merge(dayStart, 0, aoa.length - 1, 0);
  });

  aoa.push([]);
  const sr = aoa.length;
  aoa.push(["GVBM", "", "", "", "", "TỔ TRƯỞNG"]);
  aoa.push([], [], []);
  aoa.push([cfg.teacher, "", "", "", "", cfg.leader]);
  merge(sr, 0, sr, 4);
  merge(sr, 5, sr, 7);
  merge(sr + 4, 0, sr + 4, 4);
  merge(sr + 4, 5, sr + 4, 7);

  return { aoa, merges, cols: [14, 8, 6, 6, 44, 10, 30, 22].map((wch) => ({ wch })) };
}

export function exportExcel(state, week) {
  const { aoa, merges, cols } = buildSheet(state, week);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Tuần ${week}`);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const filename = `Ke hoach giang day tuan ${week}.xlsx`;
  downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
  return filename;
}
