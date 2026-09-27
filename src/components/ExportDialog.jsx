import { useRef, useState } from "react";
import { useModal } from "../hooks/useModal.js";

const ORIENTATIONS = [
  { value: "portrait", label: "Khổ dọc", note: "A4 đứng" },
  { value: "landscape", label: "Khổ ngang", note: "A4 nằm" },
];

const CHECKS = [
  { key: "showNls", label: "Cột “Nội dung tích hợp”" },
  { key: "showSchool", label: "Tên trường" },
  { key: "showYear", label: "Năm học" },
];

// Hộp thoại chọn hướng giấy và các phần hiển thị trước khi xuất file
export default function ExportDialog({ kind, initial, onConfirm, onCancel }) {
  const [opts, setOpts] = useState(initial);
  const boxRef = useRef(null);
  const set = (patch) => setOpts((o) => ({ ...o, ...patch }));
  const title = kind === "word" ? "Word" : "Excel";

  useModal(boxRef, onCancel, "input:checked");

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form
        ref={boxRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(opts);
        }}
      >
        <h2 id="export-title">Tùy chọn xuất file {title}</h2>

        <fieldset>
          <legend>Hướng giấy</legend>
          <div className="opt-seg">
            {ORIENTATIONS.map((o) => (
              <label key={o.value} className={`opt-card${opts.orientation === o.value ? " on" : ""}`}>
                <input
                  type="radio"
                  name="orientation"
                  value={o.value}
                  checked={opts.orientation === o.value}
                  onChange={() => set({ orientation: o.value })}
                />
                <span className={`page-icon ${o.value}`} aria-hidden="true" />
                <span>
                  <b>{o.label}</b>
                  <small>{o.note}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Hiển thị</legend>
          {CHECKS.map((c) => (
            <label key={c.key} className="opt-check">
              <input type="checkbox" checked={opts[c.key]} onChange={(e) => set({ [c.key]: e.target.checked })} />
              {c.label}
            </label>
          ))}
        </fieldset>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit" className="btn primary">
            Xuất file
          </button>
        </div>
      </form>
    </div>
  );
}
