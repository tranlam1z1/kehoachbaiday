import { useEffect, useRef, useState } from "react";

// useState có lưu vào localStorage (ghi sau 500ms kể từ lần sửa cuối)
export function usePersistentState(key, init, revive = (x) => x) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return revive(JSON.parse(raw));
    } catch {
      /* dữ liệu hỏng hoặc trình duyệt chặn lưu trữ: dùng giá trị mặc định */
    }
    return typeof init === "function" ? init() : init;
  });
  const [saved, setSaved] = useState(true);
  const timer = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* bỏ qua */
      }
      setSaved(true);
    }, 500);
    return () => clearTimeout(timer.current);
  }, [key, value]);

  return [value, setValue, saved];
}
