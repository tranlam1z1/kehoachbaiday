import * as XLSX from "xlsx-js-style";
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
  const centered = []; // các ô thứ ngày và đồ dùng dạy học cần căn giữa, tự xuống dòng

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
    centered.push(XLSX.utils.encode_cell({ r: dayStart, c: 0 }));
    day.sessions.forEach((s) => {
      const sessionStart = aoa.length;
      centered.push(XLSX.utils.encode_cell({ r: sessionStart, c: 6 }));
      s.rows.forEach((r, i) =>
        aoa.push([
          aoa.length === dayStart ? `${DAYS_UPPER[day.d].replace(" ", "\n")}\n${ddmm(day.date)}` : "",
          i === 0 ? s.label : "",
          r.period,
          r.cls,
          r.lesson,
          r.ppct === "" ? "" : Number(r.ppct),
          i === 0 ? r.materials : "",
          r.nls,
        ])
      );
      if (s.rows.length > 1) {
        merge(sessionStart, 1, aoa.length - 1, 1);
        merge(sessionStart, 6, aoa.length - 1, 6);
      }
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

  return { aoa, merges, centered, cols: [8, 8, 6, 6, 50, 10, 30, 22].map((wch) => ({ wch })) };
}

export function exportExcel(state, week) {
  const { aoa, merges, centered, cols } = buildSheet(state, week);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  centered.forEach((ref) => {
    if (ws[ref]) ws[ref].s = { alignment: { horizontal: "center", vertical: "center", wrapText: true } };
  });
  ws["!merges"] = merges;
  ws["!cols"] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Tuần ${week}`);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const filename = `KHGD TUẦN ${week}.xlsx`;
  downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
  return filename;
}
