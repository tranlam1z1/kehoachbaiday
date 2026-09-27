// Danh sách đồ dùng dạy học và đồ dùng của từng tiết
// config.materialList = [{ name, isDefault }]
// weeks[n].ov[slotKey].materials = ["Computer", ...] (dữ liệu cũ có thể là một chuỗi gõ tay, được giữ nguyên)

export const DEFAULT_MATERIAL_LIST = [
  { name: "Computer", isDefault: true },
  { name: "Extraboard", isDefault: true },
  { name: "Textbook", isDefault: true },
];

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
export const sameName = (a, b) => clean(a).toLocaleLowerCase("vi") === clean(b).toLocaleLowerCase("vi");
const capitalize = (s) => s.charAt(0).toLocaleUpperCase("vi") + s.slice(1);

// Bỏ tên trống và tên trùng (không phân biệt chữ hoa, chữ thường)
export function uniqueNames(names) {
  const out = [];
  names.map(clean).forEach((n) => n && !out.some((x) => sameName(x, n)) && out.push(n));
  return out;
}

// "Computer, extraboard, textbook." -> ["Computer", "extraboard", "textbook"]
export function parseMaterials(text) {
  return uniqueNames(String(text ?? "").replace(/[.\s]+$/, "").split(","));
}

// ["Computer", "Extraboard", "Textbook"] -> "Computer, extraboard, textbook."
// Chỉ viết thường chữ cái đầu của từ viết hoa thông thường, giữ nguyên tên như "PowerPoint", "TV"
export function formatMaterials(names) {
  const list = uniqueNames(names);
  if (!list.length) return "";
  const text = list
    .map((n, i) => {
      if (i === 0) return capitalize(n);
      const word = n.split(" ")[0];
      return word.slice(1) === word.slice(1).toLocaleLowerCase("vi") ? n.charAt(0).toLocaleLowerCase("vi") + n.slice(1) : n;
    })
    .join(", ");
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

// Chuyển dữ liệu cũ: dòng đồ dùng mặc định -> danh sách, tất cả đều là mặc định
export function reviveMaterialList(list, legacyText) {
  if (Array.isArray(list)) {
    const seen = [];
    return list
      .map((m) => ({ name: clean(m && m.name), isDefault: !!(m && m.isDefault) }))
      .filter((m) => m.name && !seen.some((x) => sameName(x, m.name)) && seen.push(m.name));
  }
  if (typeof legacyText === "string") return parseMaterials(legacyText).map((name) => ({ name: capitalize(name), isDefault: true }));
  return DEFAULT_MATERIAL_LIST.map((m) => ({ ...m }));
}

export const defaultNames = (cfg) => cfg.materialList.filter((m) => m.isDefault).map((m) => m.name);

// Hai danh sách có cùng các đồ dùng (không quan tâm thứ tự, chữ hoa, chữ thường)
export function sameSet(a, b) {
  return a.length === b.length && a.every((x) => b.some((y) => sameName(x, y)));
}

// Sắp xếp theo thứ tự trong danh sách, đồ dùng riêng của tiết để cuối; dùng đúng cách viết trong danh sách
export function orderByList(names, list) {
  const picked = uniqueNames(names);
  const inList = list.filter((m) => picked.some((n) => sameName(n, m.name))).map((m) => m.name);
  return [...inList, ...picked.filter((n) => !list.some((m) => sameName(n, m.name)))];
}

// Đồ dùng đã lưu riêng của một tiết, dạng mảng (chuỗi cũ được tách theo dấu phẩy)
export const overrideNames = (value) => (Array.isArray(value) ? value : parseMaterials(value));

// Duyệt mọi tiết có chọn đồ dùng riêng, fn trả về mảng mới (hoặc undefined nếu không đổi)
function eachOverride(state, fn) {
  const defaults = defaultNames(state.config);
  Object.values(state.weeks || {}).forEach((w) => {
    const ov = (w && w.ov) || {};
    Object.keys(ov).forEach((key) => {
      const o = ov[key];
      if (o.materials == null) return;
      const next = fn(overrideNames(o.materials));
      if (!next) return;
      if (sameSet(next, defaults)) delete o.materials;
      else o.materials = orderByList(next, state.config.materialList);
      if (!Object.keys(o).length) delete ov[key];
    });
  });
}

// Gán đồ dùng cho một tiết của một tuần; trùng với mặc định thì bỏ lựa chọn riêng
export function setSlotMaterials(state, week, key, names) {
  const isDefault = sameSet(names, defaultNames(state.config));
  if (isDefault && !state.weeks[week]) return;
  const w = (state.weeks[week] ||= { monday: "", ov: {} });
  w.ov ||= {};
  const o = { ...(w.ov[key] || {}) };
  if (isDefault) delete o.materials;
  else o.materials = orderByList(names, state.config.materialList);
  if (Object.keys(o).length) w.ov[key] = o;
  else delete w.ov[key];
}

// Số tiết đang chọn đồ dùng khác mặc định
export function countCustomSlots(state) {
  const defaults = defaultNames(state.config);
  let n = 0;
  Object.values(state.weeks || {}).forEach((w) =>
    Object.values((w && w.ov) || {}).forEach((o) => {
      if (o.materials != null && !sameSet(overrideNames(o.materials), defaults)) n++;
    })
  );
  return n;
}

// Đưa mọi tiết về đồ dùng mặc định
export function resetAllMaterials(state) {
  eachOverride(state, () => defaultNames(state.config));
}

// Đổi tên trong mọi tiết đang dùng (sửa trực tiếp trên bản sao state)
export function renameInState(state, oldName, newName) {
  eachOverride(state, (names) => (names.some((n) => sameName(n, oldName)) ? names.map((n) => (sameName(n, oldName) ? newName : n)) : undefined));
}

// Bỏ khỏi mọi tiết đang dùng (gọi sau khi đã xóa khỏi danh sách)
export function removeFromState(state, name) {
  eachOverride(state, (names) => (names.some((n) => sameName(n, name)) ? names.filter((n) => !sameName(n, name)) : undefined));
}
