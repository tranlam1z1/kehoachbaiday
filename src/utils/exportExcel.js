import * as XLSX from "xlsx-js-style";
import JSZip from "jszip";
import { DAYS_UPPER } from "../data/defaultState.js";
import { buildRows, weekRange, groupRows } from "./plan.js";
import { ddmm, ddmmyyyy } from "./date.js";
import { downloadBlob } from "./download.js";
import { DEFAULT_EXPORT_OPTIONS, normalizeExportOptions, planColumns, fitWidths } from "./exportOptions.js";

// Tổng độ rộng cột (số ký tự) theo hướng giấy; khi in được thu nhỏ vừa 1 trang theo chiều ngang
const TOTAL_WCH = { portrait: 140, landscape: 207 };
const SIZES = {
  fixed: { day: 8, session: 10, period: 8, cls: 8, ppct: 10 },
  share: { materials: 0.26, nls: 0.16 },
};

// Dựng bảng dữ liệu (mảng 2 chiều) và danh sách ô gộp cho Excel
export function buildSheet(state, week, options = DEFAULT_EXPORT_OPTIONS) {
  const opts = normalizeExportOptions(options);
  const cfg = state.config;
  const rows = buildRows(state, week);
  const rg = weekRange(rows, state, week);
  const cols = planColumns(opts);
  const last = cols.length - 1;
  const col = (key) => cols.findIndex((c) => c.key === key);
  const aoa = [];
  const merges = [];
  const merge = (r1, c1, r2, c2) => merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
  const centered = []; // các ô thứ ngày và đồ dùng dạy học cần căn giữa, tự xuống dòng
  const right = []; // ô năm học căn phải

  // Dòng đầu trang: tên trường bên trái (cột 1–5), năm học bên phải (cột 6 đến hết)
  if (opts.showSchool || opts.showYear) {
    const r = aoa.length;
    const line = cols.map(() => "");
    if (opts.showSchool) {
      line[0] = cfg.school;
      merge(r, 0, r, 4);
    }
    if (opts.showYear) {
      line[5] = `Năm học: ${cfg.year}`;
      merge(r, 5, r, last);
      right.push(XLSX.utils.encode_cell({ r, c: 5 }));
    }
    aoa.push(line);
  }
  merge(aoa.length, 0, aoa.length, last);
  aoa.push([`KẾ HOẠCH GIẢNG DẠY TUẦN ${week}`]);
  merge(aoa.length, 0, aoa.length, last);
  aoa.push([`(Từ ngày ${ddmmyyyy(rg.from)} đến ngày ${ddmmyyyy(rg.to)})`]);
  aoa.push([]);
  aoa.push(cols.map((c) => c.title));

  const dayCol = col("day");
  const sessionCol = col("session");
  const matCol = col("materials");
  groupRows(rows).forEach((day) => {
    const dayStart = aoa.length;
    centered.push(XLSX.utils.encode_cell({ r: dayStart, c: dayCol }));
    day.sessions.forEach((s) => {
      const sessionStart = aoa.length;
      let matStart = sessionStart; // các tiết liền nhau trong buổi có cùng đồ dùng thì gộp ô
      s.rows.forEach((r, i) => {
        const newMat = i === 0 || s.rows[i - 1].materialsText !== r.materialsText;
        if (newMat) {
          if (aoa.length - matStart > 1) merge(matStart, matCol, aoa.length - 1, matCol);
          matStart = aoa.length;
          centered.push(XLSX.utils.encode_cell({ r: matStart, c: matCol }));
        }
        const v = {
          day: aoa.length === dayStart ? `${DAYS_UPPER[day.d].replace(" ", "\n")}\n${ddmm(day.date)}` : "",
          session: i === 0 ? s.label : "",
          period: r.period,
          cls: r.cls,
          lesson: r.lesson,
          ppct: r.ppct === "" ? "" : Number(r.ppct),
          materials: newMat ? r.materialsText : "",
          nls: r.nls,
        };
        aoa.push(cols.map((c) => v[c.key]));
      });
      if (aoa.length - matStart > 1) merge(matStart, matCol, aoa.length - 1, matCol);
      if (s.rows.length > 1) merge(sessionStart, sessionCol, aoa.length - 1, sessionCol);
    });
    if (aoa.length - dayStart > 1) merge(dayStart, dayCol, aoa.length - 1, dayCol);
  });

  aoa.push([]);
  const sr = aoa.length;
  aoa.push(["GIÁO VIÊN", "", "", "", "", "TỔ TRƯỞNG CHUYÊN MÔN"]);
  aoa.push([], [], []);
  aoa.push([cfg.teacher, "", "", "", "", cfg.leader]);
  merge(sr, 0, sr, 4);
  merge(sr, 5, sr, last);
  merge(sr + 4, 0, sr + 4, 4);
  merge(sr + 4, 5, sr + 4, last);

  const widths = fitWidths(cols, TOTAL_WCH[opts.orientation], SIZES);
  return { aoa, merges, centered, right, cols: widths.map((wch) => ({ wch })) };
}

// Thư viện không ghi thiết lập trang in, nên chèn trực tiếp vào XML của từng sheet:
// khổ A4, hướng giấy đã chọn, vừa 1 trang theo chiều ngang
async function addPageSetup(buf, orientation) {
  const zip = await JSZip.loadAsync(buf);
  const sheets = Object.keys(zip.files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p));
  for (const path of sheets) {
    let xml = await zip.file(path).async("string");
    if (!xml.includes("<sheetPr")) xml = xml.replace(/(<worksheet[^>]*>)/, '$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
    xml = xml.replace(
      /(<pageMargins[^>]*\/>)/,
      `$1<pageSetup paperSize="9" orientation="${orientation}" fitToWidth="1" fitToHeight="0"/>`
    );
    zip.file(path, xml);
  }
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// Mỗi tuần một sheet
export async function exportExcel(state, weeks, label, options = DEFAULT_EXPORT_OPTIONS) {
  const opts = normalizeExportOptions(options);
  const wb = XLSX.utils.book_new();
  weeks.forEach((week) => {
    const { aoa, merges, centered, right, cols } = buildSheet(state, week, opts);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    centered.forEach((ref) => {
      if (ws[ref]) ws[ref].s = { alignment: { horizontal: "center", vertical: "center", wrapText: true } };
    });
    right.forEach((ref) => {
      if (ws[ref]) ws[ref].s = { alignment: { horizontal: "right" } };
    });
    ws["!merges"] = merges;
    ws["!cols"] = cols;
    ws["!margins"] = { left: 0.6, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
    XLSX.utils.book_append_sheet(wb, ws, `Tuần ${week}`);
  });
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const filename = `KHGD ${label}.xlsx`;
  downloadBlob(await addPageSetup(buf, opts.orientation), filename);
  return filename;
}
