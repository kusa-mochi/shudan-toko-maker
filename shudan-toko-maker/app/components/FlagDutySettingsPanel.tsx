"use client";

import { usePlannerContext } from "./PlannerContext";

export function FlagDutySettingsPanel() {
  const { flagDutySettings, updateFlagDutySetting } = usePlannerContext();

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-stone-700">
          開始日
          <input
            type="date"
            value={flagDutySettings.startDate}
            onChange={(event) => updateFlagDutySetting("startDate", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          生成する週数
          <input
            type="number"
            min={1}
            value={flagDutySettings.weeks}
            onChange={(event) => updateFlagDutySetting("weeks", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
          />
        </label>
      </div>
    </div>
  );
}