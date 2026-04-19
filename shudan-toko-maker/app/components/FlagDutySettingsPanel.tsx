"use client";

import { useState } from "react";
import { usePlannerContext } from "./PlannerContext";

export function FlagDutySettingsPanel() {
  const {
    households,
    flagDutySettings,
    updateFlagDutySetting,
    addDutyLimit,
    updateDutyLimit,
    removeDutyLimit,
  } = usePlannerContext();

  const [selectedHouseholdId, setSelectedHouseholdId] = useState("");

  const limitedHouseholdIds = new Set(
    flagDutySettings.dutyLimits.map((limit) => limit.householdId),
  );

  const availableHouseholds = households.filter(
    (household) =>
      household.children.length > 0 && !limitedHouseholdIds.has(household.id),
  );

  const handleAddLimit = () => {
    if (!selectedHouseholdId) {
      return;
    }

    addDutyLimit(selectedHouseholdId);
    setSelectedHouseholdId("");
  };

  return (
    <div className="space-y-5">
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
          終了日
          <input
            type="date"
            value={flagDutySettings.endDate}
            onChange={(event) => updateFlagDutySetting("endDate", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
          />
        </label>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-stone-800">最大担当回数の制限</h4>
        <p className="mt-1 text-xs text-stone-500">
          特定のご家庭の旗当番担当回数に上限を設定できます。過去の担当回数を含めた合計で判定されます。
        </p>

        {flagDutySettings.dutyLimits.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {flagDutySettings.dutyLimits.map((limit) => {
              const household = households.find((h) => h.id === limit.householdId);
              const label = household?.householdName || "不明なご家庭";

              return (
                <li
                  key={limit.householdId}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-stone-800">
                    {label}
                  </span>
                  <label className="flex items-center gap-1.5 text-sm text-stone-700">
                    最大
                    <input
                      type="number"
                      min={0}
                      value={limit.maxCount}
                      onChange={(event) =>
                        updateDutyLimit(
                          limit.householdId,
                          Math.max(0, Number.parseInt(event.target.value || "0", 10) || 0),
                        )
                      }
                      className="w-16 rounded-xl border border-stone-300 bg-white px-2 py-1 text-center text-sm text-stone-900 outline-none transition focus:border-amber-500"
                    />
                    回
                  </label>
                  <button
                    type="button"
                    onClick={() => removeDutyLimit(limit.householdId)}
                    className="rounded-full border border-stone-300 px-2.5 py-0.5 text-xs font-medium text-stone-600 transition hover:border-rose-400 hover:text-rose-600"
                  >
                    解除
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex-1 space-y-1 text-sm font-medium text-stone-700">
            ご家庭を選択
            <select
              value={selectedHouseholdId}
              onChange={(event) => setSelectedHouseholdId(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
            >
              <option value="">— 選択してください —</option>
              {availableHouseholds.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.householdName || "未入力のご家庭"}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleAddLimit}
            disabled={!selectedHouseholdId}
            className="rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-40"
          >
            制限を追加
          </button>
        </div>
      </div>
    </div>
  );
}