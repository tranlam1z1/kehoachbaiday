import JSZip from "jszip";
import { DAYS_UPPER } from "../data/defaultState.js";
import { buildRows, weekRange, groupRows } from "./plan.js";
import { ddmm, ddmmyyyy } from "./date.js";
import { downloadBlob } from "./download.js";

// Tạo file .docx bằng cách tự viết WordprocessingML rồi nén bằng JSZip

const xesc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FONT = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>';

function run(text, o = {}) {
  const sz = o.sz || 26; // cỡ chữ tính theo nửa point: 26 = 13pt
  return `<w:r><w:rPr>${FONT}${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${xesc(text)}</w:t></w:r>`;
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

export function buildDocxParts(state, week) {
  const cfg = state.config;
  const rows = buildRows(state, week);
  const rg = weekRange(rows, state, week);
  const W = [1100, 700, 550, 550, 3300, 800, 1800, 1122]; // độ rộng cột (dxa), tổng = 9922
  const TW = W.reduce((a, b) => a + b, 0);
  const borders = (val) =>
    ["top", "left", "bottom", "right", "insideH", "insideV"]
      .map((k) => (val === "nil" ? `<w:${k} w:val="nil"/>` : `<w:${k} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`))
      .join("");

  let x = "";
  x += para(run(cfg.school) + "<w:r><w:tab/></w:r>" + run(`Năm học: ${cfg.year}`), {
    tabs: `<w:tabs><w:tab w:val="right" w:pos="${TW}"/></w:tabs>`,
  });
  x += para(run(`KẾ HOẠCH GIẢNG DẠY TUẦN ${week}`, { b: true, sz: 30 }), { jc: "center", before: 240 });
  x += para(run(`(Từ ngày ${ddmmyyyy(rg.from)} đến ngày ${ddmmyyyy(rg.to)})`, { i: true }), { jc: "center", after: 200 });

  const header = ["Thứ ngày", "Buổi", "Tiết", "Lớp", "Tên bài dạy", "Tiết theo PPCT", "Đồ dùng dạy học", "Nội dung tích hợp"];
  x += `<w:tbl><w:tblPr><w:tblW w:w="${TW}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${borders()}</w:tblBorders><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr>`;
  x += `<w:tblGrid>${W.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  x += `<w:tr><w:trPr><w:tblHeader/></w:trPr>${header.map((h, i) => cell(h, W[i], { b: true, jc: "center", shade: "F2F2F2" })).join("")}</w:tr>`;

  if (!rows.length) {
    x += `<w:tr>${W.map((w, i) => cell(i === 4 ? "(Chưa có tiết nào trong thời khóa biểu)" : "", w)).join("")}</w:tr>`;
  }

  groupRows(rows).forEach((day) => {
    let firstOfDay = true;
    day.sessions.forEach((s) =>
      s.rows.forEach((r, i) => {
        x += "<w:tr><w:trPr><w:cantSplit/></w:trPr>";
        x += firstOfDay
          ? cell(`${DAYS_UPPER[day.d]} ${ddmm(day.date)}`, W[0], { b: true, jc: "center", vm: "restart" })
          : cell("", W[0], { vm: "cont" });
        x += i === 0 ? cell(s.label, W[1], { jc: "center", vm: "restart" }) : cell("", W[1], { vm: "cont" });
        x += cell(r.period, W[2], { jc: "center" });
        x += cell(r.cls, W[3], { jc: "center" });
        x += cell(r.lesson, W[4]);
        x += cell(r.ppct, W[5], { jc: "center" });
        x += cell(r.materials, W[6]);
        x += cell(r.nls, W[7], { jc: "center" });
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
  x += sigRow("GVBM", "TỔ TRƯỞNG") + sigRow("", "") + sigRow("", "") + sigRow("", "") + sigRow(cfg.teacher, cfg.leader);
  x += "</w:tbl>";

  // Khổ A4 dọc, lề trái 2cm, lề phải 1,5cm
  const sect = `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;

  return {
    "[Content_Types].xml":
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    "_rels/.rels":
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${x}${sect}</w:body></w:document>`,
  };
}

export async function exportWord(state, week) {
  const zip = new JSZip();
  Object.entries(buildDocxParts(state, week)).forEach(([path, content]) => zip.file(path, content));
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const filename = `Ke hoach giang day tuan ${week}.docx`;
  downloadBlob(blob, filename);
  return filename;
}
