import { formatGrade } from "./plannerUtils";
import type { Household } from "./plannerTypes";

type HouseholdPreviewPanelProps = {
  households: Household[];
};

export function HouseholdPreviewPanel({ households }: HouseholdPreviewPanelProps) {
  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/85 p-5 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-amber-700">PREVIEW</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">現在の家庭構成</h2>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {households.map((household, householdIndex) => (
          <section key={household.id} className="rounded-3xl bg-stone-50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-stone-500">家庭 {householdIndex + 1}</p>
                <h3 className="text-lg font-semibold text-stone-900">
                  {household.householdName || "未入力のご家庭"}
                </h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-600">
                旗当番 {household.pastDutyCount}回
              </span>
            </div>

            {household.memo ? (
              <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm leading-6 text-stone-600">
                {household.memo}
              </p>
            ) : null}

            <div className="mt-3 space-y-2">
              {household.children.map((child, childIndex) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm text-stone-700"
                >
                  <span>
                    {childIndex + 1}. {child.name || "氏名未入力"}
                  </span>
                  <span className="font-semibold text-stone-900">{formatGrade(child.grade)}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}