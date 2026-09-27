import { useState } from "react";
import { buildRows } from "../utils/plan.js";
import { countCustomSlots, removeFromState, renameInState, resetAllMaterials, sameName, uniqueNames } from "../utils/materials.js";

// Quản lý danh sách đồ dùng dạy học: thêm, sửa, xóa, sắp xếp, chọn đồ dùng mặc định
export default function MaterialsManager({ state, update, notify, maxWeek }) {
  const list = state.config.materialList;
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null); // { i, text }
  const [drag, setDrag] = useState(null); // { from, over }

  // Tên hợp lệ: không trống, không trùng tên khác (không phân biệt chữ hoa, chữ thường)
  function validName(raw, except = -1) {
    const [name] = uniqueNames([raw]);
    if (!name) {
      notify("Tên đồ dùng không được để trống.");
      return null;
    }
    if (list.some((m, j) => j !== except && sameName(m.name, name))) {
      notify(`“${name}” đã có trong danh sách.`);
      return null;
    }
    return name;
  }

  function add() {
    const name = validName(newName);
    if (!name) return;
    update((s) => {
      s.config.materialList.push({ name, isDefault: false });
    });
    setNewName("");
  }

  function saveEdit() {
    const { i, text } = editing;
    const name = validName(text, i);
    if (!name) return;
    const old = list[i].name;
    if (name !== old)
      update((s) => {
        s.config.materialList[i].name = name;
        renameInState(s, old, name);
      });
    setEditing(null);
  }

  // Số tiết (trong cả năm học) đang dùng đồ dùng này
  function usage(name) {
    let n = 0;
    for (let w = 1; w <= maxWeek; w++) n += buildRows(state, w).filter((r) => r.materials.some((x) => sameName(x, name))).length;
    return n;
  }

  function remove(i) {
    const { name } = list[i];
    const n = usage(name);
    if (n && !window.confirm(`“${name}” đang được dùng ở ${n} tiết. Xóa khỏi danh sách và khỏi các tiết đó?`)) return;
    update((s) => {
      s.config.materialList.splice(i, 1);
      removeFromState(s, name);
    });
    if (editing) setEditing(null);
  }

  function move(from, to) {
    if (to < 0 || to >= list.length || from === to) return;
    update((s) => {
      const [m] = s.config.materialList.splice(from, 1);
      s.config.materialList.splice(to, 0, m);
    });
  }

  // Đồng bộ: bỏ mọi lựa chọn riêng, tất cả các tiết dùng đồ dùng mặc định
  function resetAll() {
    const n = countCustomSlots(state);
    if (!n) return notify("Tất cả các tiết đang dùng đồ dùng mặc định.");
    if (!window.confirm(`Có ${n} tiết đang chọn đồ dùng khác mặc định. Đưa tất cả các tiết về đồ dùng mặc định?`)) return;
    update((s) => resetAllMaterials(s));
    notify(`Đã đưa ${n} tiết về đồ dùng mặc định.`);
  }

  const toggleDefault = (i) =>
    update((s) => {
      s.config.materialList[i].isDefault = !s.config.materialList[i].isDefault;
    });

  return (
    <>
      <h2>Đồ dùng dạy học</h2>
      <p className="hint">
        Đồ dùng đánh dấu “Mặc định” được tự điền cho mọi tiết. Kéo thả hoặc dùng nút ↑ ↓ để sắp xếp thứ tự khi in.
      </p>
      <ul className="mat-list">
        {!list.length && <li className="mat-row empty-row">Chưa có đồ dùng nào.</li>}
        {list.map((m, i) => {
          const isEditing = editing && editing.i === i;
          return (
            <li
              key={m.name}
              className={`mat-row${drag && drag.over === i && drag.from !== i ? " drop" : ""}${drag && drag.from === i ? " dragging" : ""}`}
              draggable={!editing}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", m.name);
                setDrag({ from: i, over: i });
              }}
              onDragOver={(e) => {
                if (!drag) return;
                e.preventDefault();
                if (drag.over !== i) setDrag({ ...drag, over: i });
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (drag) move(drag.from, i);
                setDrag(null);
              }}
              onDragEnd={() => setDrag(null)}
            >
              <span className="handle" aria-hidden="true" title="Kéo để sắp xếp">
                ⋮⋮
              </span>
              {isEditing ? (
                <input
                  className="mat-name-input"
                  value={editing.text}
                  aria-label={`Tên mới cho ${m.name}`}
                  autoFocus
                  onChange={(e) => setEditing({ i, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditing(null);
                  }}
                />
              ) : (
                <span className="mat-name">{m.name}</span>
              )}
              <label className="mat-default">
                <input type="checkbox" checked={m.isDefault} onChange={() => toggleDefault(i)} />
                Mặc định
              </label>
              <span className="mat-actions">
                {isEditing ? (
                  <>
                    <button className="btn small primary" onClick={saveEdit}>
                      Lưu
                    </button>
                    <button className="btn small ghost" onClick={() => setEditing(null)}>
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button className="icon-btn" aria-label={`Đưa ${m.name} lên`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                      ↑
                    </button>
                    <button className="icon-btn" aria-label={`Đưa ${m.name} xuống`} disabled={i === list.length - 1} onClick={() => move(i, i + 1)}>
                      ↓
                    </button>
                    <button className="btn small ghost" onClick={() => setEditing({ i, text: m.name })}>
                      Sửa
                    </button>
                    <button className="btn small ghost" onClick={() => remove(i)}>
                      Xóa
                    </button>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="add-row">
        <input
          value={newName}
          placeholder="Ví dụ: Flashcards"
          aria-label="Tên đồ dùng mới"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn small" onClick={add}>
          Thêm đồ dùng
        </button>
      </div>
      <div className="add-row">
        <button className="btn small ghost" onClick={resetAll}>
          Đưa tất cả các tiết về mặc định
        </button>
      </div>
    </>
  );
}
