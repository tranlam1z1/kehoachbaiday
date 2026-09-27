import { useRef, useState } from "react";
import { DAYS } from "../data/defaultState.js";
import { ddmm } from "../utils/date.js";
import { orderByList, sameName, uniqueNames } from "../utils/materials.js";
import { useModal } from "../hooks/useModal.js";

// Ô "Đồ dùng dạy học" trong bảng kế hoạch: các đồ dùng đã chọn dạng thẻ nhỏ, bấm để chọn lại
export function MaterialsCell({ row, onOpen }) {
  return (
    <td className={`mat${row.edited.materials ? " edited" : ""}`}>
      <button
        type="button"
        className="mat-btn"
        aria-label={`Đồ dùng dạy học: ${row.materials.join(", ") || "chưa chọn"}. Bấm để chọn.`}
        title={row.edited.materials ? "Đã chọn khác mặc định." : undefined}
        onClick={onOpen}
      >
        {row.materials.length ? (
          row.materials.map((n) => (
            <span key={n} className="mat-chip">
              {n}
            </span>
          ))
        ) : (
          <span className="mat-empty">Chọn…</span>
        )}
      </button>
    </td>
  );
}

// Hộp thoại chọn đồ dùng cho một tiết
export default function MaterialsPicker({ row, list, defaults, scopes, onSave, onCancel }) {
  const boxRef = useRef(null);
  useModal(boxRef, onCancel, "input[type=checkbox]");

  const [selected, setSelected] = useState(row.materials);
  // Đồ dùng riêng của tiết (không có trong danh sách)
  const [customs, setCustoms] = useState(row.materials.filter((n) => !list.some((m) => sameName(m.name, n))));
  const [toAdd, setToAdd] = useState([]); // đồ dùng riêng sẽ lưu vào danh sách
  const [other, setOther] = useState("");
  const [saveToList, setSaveToList] = useState(false);
  const [scope, setScope] = useState(scopes[0].value); // áp dụng cho: tiết này, cùng buổi, cả tuần, cả năm

  const isOn = (n) => selected.some((x) => sameName(x, n));
  const toggle = (n) => setSelected((sel) => (sel.some((x) => sameName(x, n)) ? sel.filter((x) => !sameName(x, n)) : [...sel, n]));

  function addOther() {
    const [name] = uniqueNames([other]);
    if (!name) return;
    const known = list.find((m) => sameName(m.name, name))?.name || customs.find((n) => sameName(n, name));
    if (!known) setCustoms((c) => [...c, name]);
    if (!known && saveToList) setToAdd((a) => [...a, name]);
    const n = known || name;
    setSelected((sel) => (sel.some((x) => sameName(x, n)) ? sel : [...sel, n]));
    setOther("");
  }

  const items = [...list.map((m) => ({ name: m.name, isDefault: m.isDefault })), ...customs.map((name) => ({ name, custom: true }))];

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form
        ref={boxRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mat-title"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(
            scopes.find((s) => s.value === scope),
            orderByList(selected, [...list, ...toAdd.map((name) => ({ name }))]),
            toAdd
          );
        }}
      >
        <h2 id="mat-title">Đồ dùng dạy học</h2>
        <p className="modal-sub">
          {DAYS[row.d]} {ddmm(row.date)}, {row.sessionLabel.toLowerCase()} tiết {row.period}, lớp {row.cls}
        </p>

        <fieldset>
          <legend>Chọn một hoặc nhiều đồ dùng</legend>
          {items.map((it) => (
            <label key={it.name} className="opt-check">
              <input type="checkbox" checked={isOn(it.name)} onChange={() => toggle(it.name)} />
              <span className="grow">{it.name}</span>
              {it.isDefault && <small className="tag">Mặc định</small>}
              {it.custom && (
                <small className="tag muted">{toAdd.some((n) => sameName(n, it.name)) ? "Sẽ lưu vào danh sách" : "Riêng tiết này"}</small>
              )}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Khác...</legend>
          <div className="other-row">
            <input
              value={other}
              placeholder="Gõ tên đồ dùng khác"
              aria-label="Đồ dùng khác"
              onChange={(e) => setOther(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOther();
                }
              }}
            />
            <button type="button" className="btn small" onClick={addOther} disabled={!other.trim()}>
              Thêm
            </button>
          </div>
          <label className="opt-check">
            <input type="checkbox" checked={saveToList} onChange={(e) => setSaveToList(e.target.checked)} />
            Lưu vào danh sách
          </label>
        </fieldset>

        <fieldset>
          <legend>Áp dụng cho</legend>
          {scopes.map((s) => (
            <label key={s.value} className="opt-check">
              <input type="radio" name="mat-scope" value={s.value} checked={scope === s.value} onChange={() => setScope(s.value)} />
              {s.label}
            </label>
          ))}
          {scope !== scopes[0].value && (
            <p className="hint inline warn-text">Đồ dùng đã chọn riêng ở các tiết trong phạm vi này sẽ được thay bằng lựa chọn trên.</p>
          )}
        </fieldset>

        <div className="modal-actions">
          <button type="button" className="btn ghost push-left" onClick={() => setSelected(defaults)}>
            Về mặc định
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit" className="btn primary">
            Xong
          </button>
        </div>
      </form>
    </div>
  );
}
