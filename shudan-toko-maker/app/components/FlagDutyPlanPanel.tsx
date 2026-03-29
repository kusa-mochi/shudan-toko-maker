import type { FlagDutyPlan } from "./plannerTypes";

type FlagDutyPlanPanelProps = {
  flagDutyPlan: FlagDutyPlan;
};

export function FlagDutyPlanPanel({ flagDutyPlan }: FlagDutyPlanPanelProps) {
  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/90 p-5 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-amber-700">AUTO DUTY</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">旗当番表</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
          {flagDutyPlan.slots.length}週分
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">
        担当回数が少ない家庭を優先しつつ、学校行事で対象学年の児童がいる家庭はその週の候補から外して割り当てます。
      </p>

      {flagDutyPlan.warnings.length > 0 ? (
        <div className="mt-5 space-y-2 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {flagDutyPlan.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {flagDutyPlan.slots.map((slot, slotIndex) => (
          <div key={slot.id} className="rounded-3xl bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-stone-500">第{slotIndex + 1}週</p>
                <h3 className="text-lg font-semibold text-stone-900">{slot.dateLabel}</h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                累計 {slot.totalDutyCount ?? "-"}回
              </span>
            </div>

            <div className="mt-3 rounded-2xl bg-white px-4 py-3">
              <p className="text-sm text-stone-500">担当家庭</p>
              <p className="text-base font-semibold text-stone-900">{slot.householdName}</p>
            </div>

            {slot.blockedEvents.length > 0 ? (
              <p className="mt-3 text-sm leading-6 text-stone-600">
                同週の行事: {slot.blockedEvents.join("、")}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}