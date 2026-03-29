"use client";

import { usePlannerContext } from "./PlannerContext";

export function FlagDutyPlanPanel() {
  const { flagDutyPlan } = usePlannerContext();

  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/90 p-4 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">旗当番表</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
          {flagDutyPlan.slots.length}週分
        </span>
      </div>

      <p className="mt-2 text-sm leading-5 text-stone-600">
        担当回数が少ない家庭を優先しつつ、学校行事で対象学年の児童がいる家庭はその週の候補から外して割り当てます。
      </p>

      {flagDutyPlan.warnings.length > 0 ? (
        <div className="mt-4 space-y-1.5 rounded-3xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {flagDutyPlan.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {flagDutyPlan.slots.length === 0 ? (
        <p className="mt-4 rounded-3xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
          まだ旗当番表がありません。右下のボタンから生成してください。
        </p>
      ) : (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white">
          <table className="min-w-full border-collapse text-sm">
            <thead className="text-stone-700">
              <tr>
                <th className="sticky top-0 z-10 w-20 border-b border-stone-200 bg-stone-100 px-3 py-2 text-left font-semibold">週</th>
                <th className="sticky top-0 z-10 w-44 border-b border-stone-200 bg-stone-100 px-3 py-2 text-left font-semibold">日付</th>
                <th className="sticky top-0 z-10 border-b border-stone-200 bg-stone-100 px-3 py-2 text-left font-semibold">担当家庭</th>
                <th className="sticky top-0 z-10 border-b border-stone-200 bg-stone-100 px-3 py-2 text-left font-semibold">同週の行事</th>
                <th className="sticky top-0 z-10 w-24 border-b border-stone-200 bg-stone-100 px-3 py-2 text-center font-semibold">累計回数</th>
              </tr>
            </thead>
            <tbody>
              {flagDutyPlan.slots.map((slot, slotIndex) => (
                <tr key={slot.id} className="align-top odd:bg-stone-50/60">
                  <td className="whitespace-nowrap border-b border-stone-100 px-3 py-2 font-medium text-stone-700">
                    第{slotIndex + 1}週
                  </td>
                  <td className="whitespace-nowrap border-b border-stone-100 px-3 py-2 text-stone-900">
                    {slot.dateLabel}
                  </td>
                  <td className="border-b border-stone-100 px-3 py-2 font-semibold text-stone-900">
                    {slot.householdName}
                  </td>
                  <td className="border-b border-stone-100 px-3 py-2 text-stone-700">
                    {slot.blockedEvents.length > 0 ? slot.blockedEvents.join("、") : <span className="text-stone-400">-</span>}
                  </td>
                  <td className="whitespace-nowrap border-b border-stone-100 px-3 py-2 text-center font-semibold text-stone-700">
                    {slot.totalDutyCount ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}