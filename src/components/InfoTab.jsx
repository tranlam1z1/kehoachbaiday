import { useState } from "react";
import { gradeOf } from "../data/ppct.js";

const FIELDS = [
  { key: "school", label: "Tên trường" },
  { key: "year", label: "Năm học" },
  { key: "teacher", label: "Giáo viên bộ môn" },
  { key: "leader", label: "Tổ trưởng" },
  { key: "materials", label: "Đồ dùng dạy học mặc định" },
  { key: "week1", label: "Thứ Hai của tuần 1", type: "date" },
];

export default function InfoTab({ state, update, notify }) {
  const { config } = state;
  const [newClass, setNewClass] = useState("");

  const setField = (key, value) => {
    if (key === "week1" && !value) return;
    update((s) => {
      s.config[key] = value;
    });
  };

  const setOffset = (i, value) =>
    update((s) => {
      s.config.classes[i].offset = Math.round(Number(value) || 0);
    });

  function removeClass(i) {
    const c = config.classes[i];
    const used = Object.entries(config.timetable).filter(([, v]) => v === c.name);
    if (used.length && !window.confirm(`Lớp ${c.name} đang có ${used.length} tiết trong thời khóa biểu. Xóa lớp và các tiết đó?`)) return;
    update((s) => {
      used.forEach(([k]) => delete s.config.timetable[k]);
      s.config.classes.splice(i, 1);
    });
  }

  function addClass() {
    const n = newClass.trim().toUpperCase();
    if (!n) return;
    if (config.classes.some((c) => c.name === n)) return notify(`Lớp ${n} đã có trong danh sách.`);
    update((s) => {
      s.config.classes.push({ name: n, offset: 0 });
      s.config.classes.sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true }));
    });
    setNewClass("");
  }

  return (
    <section>
      <h2>Thông tin in trên kế hoạch</h2>
      <div className="grid2">
        {FIELDS.map((f) => (
          <label key={f.key} className="field">
            <span>{f.label}</span>
            <input type={f.type || "text"} value={config[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} />
          </label>
        ))}
      </div>

      <h2>Các lớp</h2>
      <p className="hint">
        Khối được lấy theo chữ số đầu của tên lớp. Nếu một lớp bị nghỉ hoặc dạy bù làm lệch tiến độ, nhập số tiết lệch:
        −1 khi lớp nghỉ mất 1 tiết, +1 khi lớp dạy bù thêm 1 tiết.
      </p>
      <div className="scroll classes">
        <table>
          <thead>
            <tr>
              <th>Lớp</th>
              <th>Khối</th>
              <th>Số tiết lệch</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {config.classes.map((c, i) => {
              const g = gradeOf(c.name);
              return (
                <tr key={c.name}>
                  <td>
                    <b>{c.name}</b>
                  </td>
                  <td>{g ? `Khối ${g}` : <span className="warn-text">Chưa có PPCT</span>}</td>
                  <td>
                    <input
                      type="number"
                      step="1"
                      value={Number(c.offset) || 0}
                      aria-label={`Số tiết lệch của ${c.name}`}
                      onChange={(e) => setOffset(i, e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="btn small ghost" onClick={() => removeClass(i)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="add-row">
        <input
          value={newClass}
          placeholder="Ví dụ: 3B"
          aria-label="Tên lớp mới"
          onChange={(e) => setNewClass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addClass()}
        />
        <button className="btn small" onClick={addClass}>
          Thêm lớp
        </button>
      </div>
    </section>
  );
}
