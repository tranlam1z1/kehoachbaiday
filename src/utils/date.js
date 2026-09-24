// Làm việc với ngày theo UTC để không bị lệch múi giờ
export function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
export const toIso = (dt) => dt.toISOString().slice(0, 10);
export const addDays = (dt, n) => new Date(dt.getTime() + n * 86400000);
const pad2 = (n) => String(n).padStart(2, "0");
export const ddmm = (dt) => `${pad2(dt.getUTCDate())}/${pad2(dt.getUTCMonth() + 1)}`;
export const ddmmyyyy = (dt) => `${ddmm(dt)}/${dt.getUTCFullYear()}`;
