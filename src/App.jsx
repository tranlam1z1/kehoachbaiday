import { useCallback, useMemo, useState } from "react";
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

const MAX_WEEK = 35;

const TABS = [
  { id: "plan", label: "Kế hoạch tuần" },
  { id: "timetable", label: "Thời khóa biểu" },
  { id: "info", label: "Lớp và thông tin" },
  { id: "ppct", label: "Phân phối chương trình" },
];

export default function App() {
  const [state, setState, saved] = usePersistentState("khgd-state-v1", defaultState, mergeState);
  const [week, setWeekRaw] = usePersistentState("khgd-week", 1);
  const [tab, setTab] = useState("plan");
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

  async function handleExport(kind) {
    try {
      const name = kind === "word" ? await exportWord(state, week) : exportExcel(state, week);
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
        onExportWord={() => handleExport("word")}
        onExportExcel={() => handleExport("excel")}
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <main>
        {tab === "plan" && (
          <PlanTab state={state} week={week} rows={rows} update={update} notify={notify} saved={saved} />
        )}
        {tab === "timetable" && <TimetableTab state={state} update={update} />}
        {tab === "info" && <InfoTab state={state} update={update} notify={notify} />}
        {tab === "ppct" && <PpctTab />}
      </main>
      <Toast message={toast} />
    </>
  );
}
