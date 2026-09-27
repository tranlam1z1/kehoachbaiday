import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultState, mergeState } from "./data/defaultState.js";
import { usePersistentState } from "./hooks/usePersistentState.js";
import { buildRows, weekRange } from "./utils/plan.js";
import { exportWord } from "./utils/exportWord.js";
import { exportExcel } from "./utils/exportExcel.js";
import Header from "./components/Header.jsx";
import Tabs from "./components/Tabs.jsx";
import PlanTab from "./components/PlanTab.jsx";
import TimetableTab from "./components/TimetableTab.jsx";
import InfoTab from "./components/InfoTab.jsx";
import PpctTab from "./components/PpctTab.jsx";
import Toast, { useToast } from "./components/Toast.jsx";
import ExportDialog from "./components/ExportDialog.jsx";
import { DEFAULT_EXPORT_OPTIONS, normalizeExportOptions } from "./utils/exportOptions.js";

const MAX_WEEK = 35;
const HK1_END = 18; // Học kì I: tuần 1–18, học kì II: tuần 19–35

// Danh sách tuần và tên file theo phạm vi xuất đã chọn
function exportWeeks(scope, week) {
  const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (scope.mode === "hk1") return { weeks: span(1, HK1_END), label: "HỌC KÌ I" };
  if (scope.mode === "hk2") return { weeks: span(HK1_END + 1, MAX_WEEK), label: "HỌC KÌ II" };
  if (scope.mode === "year") return { weeks: span(1, MAX_WEEK), label: "CẢ NĂM" };
  if (scope.mode === "range") {
    const clamp = (n) => Math.max(1, Math.min(MAX_WEEK, Math.round(Number(n) || 1)));
    const a = Math.min(clamp(scope.from), clamp(scope.to));
    const b = Math.max(clamp(scope.from), clamp(scope.to));
    return { weeks: span(a, b), label: a === b ? `TUẦN ${a}` : `TUẦN ${a}-${b}` };
  }
  return { weeks: [week], label: `TUẦN ${week}` };
}

const TABS = [
  { id: "plan", label: "Kế hoạch tuần" },
  { id: "timetable", label: "Thời khóa biểu" },
  { id: "info", label: "Lớp và thông tin" },
  { id: "ppct", label: "Phân phối chương trình" },
];

export default function App() {
  const [state, setState, saved] = usePersistentState("khgd-state-v1", defaultState, mergeState);
  const [week, setWeekRaw] = usePersistentState("khgd-week", 1);
  const [scope, setScope] = usePersistentState("khgd-export", { mode: "week", from: 1, to: 4 });
  const [exportOpts, setExportOpts] = usePersistentState("khgd-export-options", DEFAULT_EXPORT_OPTIONS, normalizeExportOptions);
  const [dialog, setDialog] = useState(null); // "word" | "excel" khi đang mở hộp thoại tùy chọn xuất
  const closeDialog = useCallback(() => setDialog(null), []);
  const [tab, setTab] = useState("plan");
  // Giao diện: "auto" theo máy, "light" sáng, "dark" tối
  const [theme, setTheme] = usePersistentState("khgd-theme", "auto", (t) => (t === "light" || t === "dark" ? t : "auto"));
  useEffect(() => {
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const [toast, notify] = useToast();

  // Cập nhật state theo kiểu "sửa trên bản sao"
  const update = useCallback(
    (fn) =>
      setState((prev) => {
        const next = structuredClone(prev);
        fn(next);
        return next;
      }),
    [setState]
  );

  const setWeek = (n) => setWeekRaw(Math.max(1, Math.min(MAX_WEEK, Math.round(Number(n) || 1))));

  const rows = useMemo(() => buildRows(state, week), [state, week]);
  const range = useMemo(() => weekRange(rows, state, week), [rows, state, week]);

  async function handleExport(kind, opts) {
    setDialog(null);
    setExportOpts(opts);
    try {
      const { weeks, label } = exportWeeks(scope, week);
      const name = await (kind === "word" ? exportWord : exportExcel)(state, weeks, label, opts);
      notify(`Đã tải ${name}`);
    } catch (err) {
      console.error(err);
      notify("Không tạo được file. Hãy thử lại.");
    }
  }

  return (
    <>
      <Header
        config={state.config}
        week={week}
        maxWeek={MAX_WEEK}
        range={range}
        onWeekChange={setWeek}
        scope={scope}
        onScopeChange={setScope}
        onExportWord={() => setDialog("word")}
        onExportExcel={() => setDialog("excel")}
        theme={theme}
        onThemeChange={setTheme}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <main>
        {tab === "plan" && (
          <PlanTab state={state} week={week} maxWeek={MAX_WEEK} rows={rows} update={update} notify={notify} saved={saved} />
        )}
        {tab === "timetable" && <TimetableTab state={state} update={update} />}
        {tab === "info" && <InfoTab state={state} update={update} notify={notify} maxWeek={MAX_WEEK} />}
        {tab === "ppct" && <PpctTab />}
      </main>
      {dialog && (
        <ExportDialog kind={dialog} initial={exportOpts} onConfirm={(opts) => handleExport(dialog, opts)} onCancel={closeDialog} />
      )}
      <Toast message={toast} />
    </>
  );
}
