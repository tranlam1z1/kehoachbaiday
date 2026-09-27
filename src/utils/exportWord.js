import JSZip from "jszip";
import { DAYS_UPPER } from "../data/defaultState.js";
import { buildRows, groupRows } from "./plan.js";
import { ddmm } from "./date.js";
import { downloadBlob } from "./download.js";
import { DEFAULT_EXPORT_OPTIONS, normalizeExportOptions, planColumns, fitWidths, schoolYearLine } from "./exportOptions.js";

// Tạo file .docx bằng cách tự viết WordprocessingML rồi nén bằng JSZip

const xesc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FONT = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>';

function run(text, o = {}) {
  const sz = o.sz || 26; // cỡ chữ tính theo nửa point: 26 = 13pt
  return `<w:r><w:rPr>${FONT}${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>${String(text ?? "")
    .split("\n")
    .map((t) => `<w:t xml:space="preserve">${xesc(t)}</w:t>`)
    .join("<w:br/>")}</w:r>`;
}

function para(runs, o = {}) {
  return `<w:p><w:pPr>${o.tabs || ""}<w:spacing w:before="${o.before || 0}" w:after="${o.after || 0}"/>${o.jc ? `<w:jc w:val="${o.jc}"/>` : ""}</w:pPr>${runs}</w:p>`;
}

function cell(content, width, o = {}) {
  const vMerge = o.vm === "restart" ? '<w:vMerge w:val="restart"/>' : o.vm === "cont" ? "<w:vMerge/>" : "";
  const shade = o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : "";
  const body = o.vm === "cont" ? "<w:p/>" : para(run(content, { b: o.b, sz: o.sz || 24 }), { jc: o.jc || "left" });
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${vMerge}${shade}<w:vAlign w:val="center"/></w:tcPr>${body}</w:tc>`;
}

// Khổ A4 (dxa), lề trái 2cm, lề phải 1,5cm
const PAGE = { portrait: { w: 11906, h: 16838 }, landscape: { w: 16838, h: 11906 } };
const MARGIN = { top: 1134, right: 850, bottom: 1134, left: 1134 };

// Độ rộng cột (dxa): cột hẹp cố định, "Đồ dùng dạy học" và "Nội dung tích hợp" theo tỉ lệ phần còn lại
const SIZES = {
  fixed: { day: 750, session: 850, period: 700, cls: 700, ppct: 800 },
  share: { materials: 0.26, nls: 0.16 },
};

// Nội dung một tuần: tiêu đề, bảng kế hoạch, phần ký tên
function weekBody(state, week, opts) {
  const cfg = state.config;
  const rows = buildRows(state, week);
  const TW = PAGE[opts.orientation].w - MARGIN.left - MARGIN.right; // bề ngang vùng in
  const cols = planColumns(opts);
  const W = fitWidths(cols, TW, SIZES);
  const borders = (val) =>
    ["top", "left", "bottom", "right", "insideH", "insideV"]
      .map((k) => (val === "nil" ? `<w:${k} w:val="nil"/>` : `<w:${k} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`))
      .join("");

  let x = "";
  // Dòng đầu trang: tên trường bên trái, năm học bên phải
  const topLine = opts.showSchool || opts.showYear;
  if (topLine) {
    x += para(
      (opts.showSchool ? run(cfg.school) : "") + (opts.showYear ? "<w:r><w:tab/></w:r>" + run(`Năm học: ${cfg.year}`) : ""),
      { tabs: `<w:tabs><w:tab w:val="right" w:pos="${TW}"/></w:tabs>` }
    );
  }
  x += para(run(`KẾ HOẠCH GIẢNG DẠY TUẦN ${week}`, { b: true, sz: 30 }), { jc: "center", before: topLine ? 240 : 0 });
  x += para(run(schoolYearLine(cfg.year), { i: true }), { jc: "center", after: 200 });

  x += `<w:tbl><w:tblPr><w:tblW w:w="${TW}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${borders()}</w:tblBorders><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr>`;
  x += `<w:tblGrid>${W.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  x += `<w:tr><w:trPr><w:tblHeader/></w:trPr>${cols.map((c, i) => cell(c.title, W[i], { b: true, jc: "center", shade: "F2F2F2" })).join("")}</w:tr>`;

  if (!rows.length) {
    x += `<w:tr>${W.map((w, i) => cell(cols[i].key === "lesson" ? "(Chưa có tiết nào trong thời khóa biểu)" : "", w)).join("")}</w:tr>`;
  }

  groupRows(rows).forEach((day) => {
    let firstOfDay = true;
    day.sessions.forEach((s) =>
      s.rows.forEach((r, i) => {
        const tc = {
          day: (w) =>
            firstOfDay
              ? cell(`${DAYS_UPPER[day.d].replace(" ", "\n")}\n${ddmm(day.date)}`, w, { b: true, jc: "center", vm: "restart" })
              : cell("", w, { vm: "cont" }),
          session: (w) => (i === 0 ? cell(s.label, w, { jc: "center", vm: "restart" }) : cell("", w, { vm: "cont" })),
          period: (w) => cell(r.period, w, { jc: "center" }),
          cls: (w) => cell(r.cls, w, { jc: "center" }),
          lesson: (w) => cell(r.lesson, w),
          ppct: (w) => cell(r.ppct, w, { jc: "center" }),
          // Các tiết liền nhau trong buổi có cùng đồ dùng thì gộp ô
          materials: (w) =>
            i > 0 && s.rows[i - 1].materialsText === r.materialsText
              ? cell("", w, { vm: "cont" })
              : cell(r.materialsText, w, { jc: "center", vm: "restart" }),
          nls: (w) => cell(r.nls, w, { jc: "center" }),
        };
        x += "<w:tr><w:trPr><w:cantSplit/></w:trPr>";
        x += cols.map((c, j) => tc[c.key](W[j])).join("");
        x += "</w:tr>";
        firstOfDay = false;
      })
    );
  });
  x += "</w:tbl>";

  // Phần ký tên (bảng 2 cột không viền)
  const half = Math.round(TW / 2);
  const sigRow = (a, b) =>
    `<w:tr>${[a, b].map((t) => `<w:tc><w:tcPr><w:tcW w:w="${half}" w:type="dxa"/></w:tcPr>${para(run(t, { b: true }), { jc: "center" })}</w:tc>`).join("")}</w:tr>`;
  x += para("", { before: 240 });
  x += `<w:tbl><w:tblPr><w:tblW w:w="${half * 2}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${borders("nil")}</w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="${half}"/><w:gridCol w:w="${half}"/></w:tblGrid>`;
  x += sigRow("GIÁO VIÊN", "TỔ TRƯỞNG CHUYÊN MÔN") + sigRow("", "") + sigRow("", "") + sigRow("", "") + sigRow(cfg.teacher, cfg.leader);
  x += "</w:tbl>";
  return x;
}

// Nhiều tuần trong một file, mỗi tuần bắt đầu ở trang mới
export function buildDocxParts(state, weeks, options = DEFAULT_EXPORT_OPTIONS) {
  const opts = normalizeExportOptions(options);
  const PAGE_BREAK = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  const x = weeks.map((w) => weekBody(state, w, opts)).join(PAGE_BREAK);

  const pg = PAGE[opts.orientation];
  const orient = opts.orientation === "landscape" ? ' w:orient="landscape"' : "";
  const sect = `<w:sectPr><w:pgSz w:w="${pg.w}" w:h="${pg.h}"${orient}/><w:pgMar w:top="${MARGIN.top}" w:right="${MARGIN.right}" w:bottom="${MARGIN.bottom}" w:left="${MARGIN.left}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;

  return {
    "[Content_Types].xml":
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    "_rels/.rels":
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${x}${sect}</w:body></w:document>`,
  };
}

export async function exportWord(state, weeks, label, options = DEFAULT_EXPORT_OPTIONS) {
  const zip = new JSZip();
  Object.entries(buildDocxParts(state, weeks, options)).forEach(([path, content]) => zip.file(path, content));
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const filename = `KHGD ${label}.docx`;
  downloadBlob(blob, filename);
  return filename;
}
