"use client";

import { usePlannerContext } from "./PlannerContext";
import { HouseholdEditorCard } from "./HouseholdEditorCard";

export function HouseholdFormSection() {
  const { households, addHousehold } = usePlannerContext();

  return (
    <div className="space-y-4">
      {households.map((household, householdIndex) => (
        <HouseholdEditorCard
          key={household.id}
          household={household}
          householdIndex={householdIndex}
        />
      ))}

      <button
        type="button"
        onClick={addHousehold}
        className="flex w-full items-center justify-center rounded-[28px] border border-dashed border-stone-400 bg-white/70 px-6 py-5 text-base font-semibold text-stone-800 transition hover:border-stone-900 hover:bg-white"
      >
        家庭を追加する
      </button>
    </div>
  );
}