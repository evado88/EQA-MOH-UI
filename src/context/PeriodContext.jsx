import { createContext, useState, useContext } from "react";
import Assist from "../classes/assist";
import assert from "assert";
// 1. Create context
const PeriodContext = createContext();

// 2. Create provider
export function PeriodProvider({ children }) {
  const [periodYear, setPeriodYear] = useState(() => {
    const periodId = Assist.getCurrentPeriodYear();
    return periodId;
  });
  const [periodMonth, setPeriodMonth] = useState(() => {
    const periodId = Assist.getCurrentPeriodMonth();
    return periodId;
  });

  const [periodYearData, setPeriodYearData] = useState(() => {
    const years = [];

    for (let i = 2025; i <= 2026; i++) {
      years.push(i);
    }

    return years;
  });

  const [periodMonthData, setPeriodMonthData] = useState(() => {
    const months = [];

    for (let i = 1; i <= 12; i++) {
      months.push({ value: i, text: Assist.getMonthName(i) });
    }

    return months;
  });

   const [periodId, setPeriodId] = useState(() => {
    const periodId = Assist.getCurrentPeriodId();
    return periodId;
  });

  const [periodData, setPeriodData] = useState(() => {
    const data = [];

    for (let year = 2025; year <= 2026; year++) {
      for (let month = 1; month <= 12; month++) {
        data.push({ value: Assist.getPeriodId(year, month), text: `${year} ${Assist.getMonthName(month)}`});
      }
    }

    return data;
  });

  const UpdatePeriodYear = (newYear) => setPeriodYear(newYear);
  const UpdatePeriodMonth = (newMonth) => setPeriodMonth(newMonth);
  const UpdatePeriodId = (newId) => setPeriodId(newId);

  return (
    <PeriodContext.Provider
      value={{
        periodYear,
        periodMonth,
        UpdatePeriodYear,
        UpdatePeriodMonth,
        periodYearData,
        periodMonthData,
        periodId,
        UpdatePeriodId,
        setPeriodId,
        periodData
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

// 3. Create a custom hook (cleaner usage)
export function usePeriod() {
  return useContext(PeriodContext);
}
