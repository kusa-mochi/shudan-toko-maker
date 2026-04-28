"use client";

import { usePlannerContext } from "./PlannerContext";
import type { Household } from "./plannerTypes";
import { gradeOptions } from "./plannerTypes";

type HouseholdEditorCardProps = {
  household: Household;
  householdIndex: number;
};

export function HouseholdEditorCard({ household, householdIndex }: HouseholdEditorCardProps) {
  const {
    removeHousehold,
    updateHouseholdText,
    updateHouseholdDutyCount,
    addChild,
    updateChildName,
    updateChildGrade,
    removeChild,
  } = usePlannerContext();

  return (
    <article className="rounded-[28px] border border-stone-200/90 bg-white/90 p-4 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.5)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">ご家庭情報</h2>
        </div>
        <button
          type="button"
          onClick={() => removeHousehold(household.id)}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
        >
          この家庭を削除
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-stone-700">
          番地/部屋番号
          <input
            type="text"
            value={household.addressOrRoom}
            onChange={(event) => updateHouseholdText(household.id, "addressOrRoom", event.target.value)}
            placeholder="例: 203号室 / 12番地"
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 lg:col-span-1">
          ご家庭名
          <input
            type="text"
            value={household.householdName}
            onChange={(event) => updateHouseholdText(household.id, "householdName", event.target.value)}
            placeholder="例: 山田"
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          旗当番の担当回数
          <input
            type="number"
            min={0}
            value={household.pastDutyCount}
            onChange={(event) => updateHouseholdDutyCount(household.id, event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700 lg:col-span-3">
          補足メモ
          <input
            type="text"
            value={household.memo}
            onChange={(event) => updateHouseholdText(household.id, "memo", event.target.value)}
            placeholder="例: 新1年生あり / 途中転入予定"
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
          />
        </label>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900">小学生のお子さん</h3>
          <button
            type="button"
            onClick={() => addChild(household.id)}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            児童を追加
          </button>
        </div>

        <div className="space-y-2">
          {household.children.map((child, childIndex) => (
            <div
              key={child.id}
              className="grid grid-cols-[minmax(0,1fr)_6.75rem_auto] items-end gap-2 rounded-3xl border border-stone-200 bg-stone-50 p-3 md:grid-cols-[1.5fr_0.8fr_auto]"
            >
              <label className="min-w-0 space-y-2 text-sm font-medium text-stone-700">
                児童 {childIndex + 1} 氏名
                <input
                  type="text"
                  value={child.name}
                  onChange={(event) => updateChildName(household.id, child.id, event.target.value)}
                  placeholder="例: 山田 花子"
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700">
                学年
                <select
                  value={child.grade}
                  onChange={(event) => updateChildGrade(household.id, child.id, Number.parseInt(event.target.value, 10) as typeof child.grade)}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                >
                  {gradeOptions.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => removeChild(household.id, child.id)}
                className="justify-self-end self-end whitespace-nowrap rounded-2xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}