// Ô nhập liệu chỉ ghi nhận khi rời ô hoặc nhấn Enter; Esc để hủy
export default function EditableCell({ value, edited, className, label, numeric, rowSpan, onCommit }) {
  const text = String(value ?? "");
  return (
    <td className={`${className}${edited ? " edited" : ""}`} rowSpan={rowSpan}>
      <input
        key={text}
        defaultValue={text}
        aria-label={label}
        inputMode={numeric ? "numeric" : undefined}
        title={edited ? "Đã sửa tay. Xóa trống ô để trở về theo PPCT." : undefined}
        onBlur={(e) => {
          if (e.target.value === text) return;
          if (onCommit(e.target.value) === false) e.target.value = text;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = text;
            e.currentTarget.blur();
          }
        }}
      />
    </td>
  );
}
