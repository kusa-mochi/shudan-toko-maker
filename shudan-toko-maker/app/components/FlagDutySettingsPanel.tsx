"use client";

import { usePlannerContext } from "./PlannerContext";

export function FlagDutySettingsPanel() {
  const { flagDutySettings, updateFlagDutySetting } = usePlannerContext();

  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/85 p-5 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] backdrop-blur sm:p-6">
      <h2 className="mt-1 text-2xl font-semibold text-stone-900">旗当番表の生成条件</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
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
      <p className="mt-3 text-sm leading-6 text-stone-600">
        1週間につき1家庭を割り当て、過去の担当回数が少ない家庭を優先します。対象学年の学校行事がある週は、その家庭を候補から外します。
      </p>
    </section>
  );
}