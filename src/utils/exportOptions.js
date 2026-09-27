// Tùy chọn khi xuất file và cách chia độ rộng cột cho vừa bề ngang trang

export const DEFAULT_EXPORT_OPTIONS = { orientation: "portrait", showNls: true, showSchool: true, showYear: true };

// Chuẩn hóa tùy chọn (dữ liệu cũ trong localStorage có thể thiếu hoặc sai kiểu)
export function normalizeExportOptions(o) {
  const src = o && typeof o === "object" ? o : {};
  return {
    orientation: src.orientation === "landscape" ? "landscape" : "portrait",
    showNls: src.showNls !== false,
    showSchool: src.showSchool !== false,
    showYear: src.showYear !== false,
  };
}

const COLUMNS = [
  { key: "day", title: "Thứ ngày" },
  { key: "session", title: "Buổi" },
  { key: "period", title: "Tiết" },
  { key: "cls", title: "Lớp" },
  { key: "lesson", title: "Tên bài dạy" },
  { key: "ppct", title: "Tiết theo PPCT" },
  { key: "materials", title: "Đồ dùng dạy học" },
  { key: "nls", title: "Nội dung tích hợp" },
];

// Dòng dưới tiêu đề khi xuất file: "2026-2027" -> "Năm học 2026 - 2027"
export const schoolYearLine = (year) => `Năm học ${String(year ?? "").trim().replace(/\s*[-–]\s*/, " - ")}`;

// Các cột của bảng kế hoạch theo tùy chọn
export function planColumns(opts) {
  return COLUMNS.filter((c) => c.key !== "nls" || opts.showNls);
}

// Chia bề ngang `total` cho các cột: cột trong `fixed` giữ nguyên độ rộng, cột trong `share`
// lấy theo tỉ lệ phần còn lại, cột "Tên bài dạy" nhận toàn bộ phần dư nên luôn rộng nhất
export function fitWidths(cols, total, { fixed, share }) {
  const rest = total - cols.reduce((s, c) => s + (fixed[c.key] || 0), 0);
  const w = cols.map((c) => fixed[c.key] ?? (share[c.key] ? Math.round(rest * share[c.key]) : 0));
  const i = cols.findIndex((c) => c.key === "lesson");
  w[i] += total - w.reduce((a, b) => a + b, 0);
  return w;
}
