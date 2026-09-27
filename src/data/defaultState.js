import { normalizeClassName } from "./ppct.js";
import { DEFAULT_MATERIAL_LIST, reviveMaterialList } from "../utils/materials.js";

export const DAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu"];
export const DAYS_UPPER = ["THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU"];
export const SESSIONS = [
  { key: "S", label: "Sáng", periods: 5 },
  { key: "C", label: "Chiều", periods: 4 },
];

// Khóa của một tiết trong thời khóa biểu: "<thứ>-<buổi>-<tiết>", ví dụ "0-S-2" = Thứ Hai, sáng, tiết 2
export const slotKey = (day, session, period) => `${day}-${session}-${period}`;

export function defaultState() {
  const timetable = {};
  const put = (day, session, list) =>
    list.forEach(([period, cls]) => (timetable[slotKey(day, session, period)] = cls));

  put(0, "S", [[2, "1A"], [3, "3A"], [4, "3A"]]);
  put(0, "C", [[1, "2E"], [2, "1E"], [3, "1E"]]);
  put(1, "S", [[1, "1C"], [2, "1D"], [3, "1D"], [4, "1A"]]);
  put(1, "C", [[1, "2A"], [2, "2B"], [3, "2E"]]);
  put(2, "S", [[1, "2C"], [2, "2D"], [3, "2A"], [4, "2B"]]);
  put(3, "S", [[1, "1C"], [2, "1B"], [3, "2C"], [4, "2D"]]);
  put(3, "C", [[1, "3A"], [2, "3A"], [3, "1B"]]);

  return {
    config: {
      school: "Trường Tiểu học Tiên Trang 1",
      year: "2026-2027",
      teacher: "Lê Thị Phương Thảo",
      leader: "Lê Thị Thảo",
      materialList: DEFAULT_MATERIAL_LIST.map((m) => ({ ...m })),
      week1: "2026-09-07",
      classes: ["1A", "1B", "1C", "1D", "1E", "2A", "2B", "2C", "2D", "2E", "3A"].map((name) => ({ name, offset: 0 })),
      timetable,
    },
    // weeks[n] = { monday: "YYYY-MM-DD" | "", ov: { [slotKey]: { ppct?, lesson?, nls?, materials?: string[] } } }
    weeks: {},
  };
}

export function mergeState(saved) {
  const d = defaultState();
  if (!saved || typeof saved !== "object") return d;
  const config = { ...d.config, ...(saved.config || {}) };
  // Đổi tên lớp kiểu cũ "5A (LUYỆN ANH)" sang "5A LA", cả trong danh sách lớp và thời khóa biểu
  const seen = new Set();
  config.classes = config.classes
    .map((c) => ({ ...c, name: normalizeClassName(c.name) }))
    .filter((c) => !seen.has(c.name) && seen.add(c.name));
  // Dữ liệu cũ chỉ có dòng chữ "materials": chuyển thành danh sách đồ dùng
  config.materialList = reviveMaterialList(saved.config && saved.config.materialList, saved.config && saved.config.materials);
  config.timetable = Object.fromEntries(Object.entries(config.timetable).map(([k, v]) => [k, normalizeClassName(v)]));
  return { config, weeks: saved.weeks || {} };
}
