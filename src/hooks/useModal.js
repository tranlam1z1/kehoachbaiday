import { useEffect } from "react";

const FOCUSABLE = "input:not([type=radio]),input[type=radio]:checked,button:not(:disabled)";

// Hộp thoại: Esc để hủy, giữ phím Tab trong hộp thoại, trả lại tiêu điểm khi đóng
// onCancel cần ổn định (useCallback) để không chạy lại mỗi lần vẽ
export function useModal(boxRef, onCancel, initialFocus = FOCUSABLE) {
  useEffect(() => {
    const prev = document.activeElement;
    boxRef.current?.querySelector(initialFocus)?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Tab") {
        const els = boxRef.current.querySelectorAll(FOCUSABLE);
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [boxRef, onCancel, initialFocus]);
}
