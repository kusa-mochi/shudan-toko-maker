"use client";

import { formatGrade } from "./plannerUtils";
import { usePlannerContext } from "./PlannerContext";

export function GroupPlanPanel() {
  const { groupPlan } = usePlannerContext();

  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/90 p-5 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">登校班表</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
          {groupPlan.groups.length}班を生成
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">
        各班の先頭には最年長の児童を、最後尾にはその次に最年長の児童を順番に配置しています。残りの児童は人数条件と個別事情を見ながら割り当てます。
      </p>

      {groupPlan.warnings.length > 0 ? (
        <div className="mt-5 space-y-2 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {groupPlan.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {groupPlan.groups.map((group) => (
          <section key={group.name} className="rounded-3xl bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">{group.name}</h3>
                <p className="text-sm text-stone-500">{group.members.length}人 / 目安 {group.targetSize}人</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {group.members.map((child, index) => {
                const roleLabel =
                  child.id === group.leaderId
                    ? "先頭"
                    : child.id === group.rearId
                      ? "最後尾"
                      : `中央 ${index}`;

                return (
                  <div
                    key={child.id}
                    className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm text-stone-700"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{child.name || "氏名未入力"}</p>
                      <p className="text-stone-500">
                        {child.householdName || "未入力のご家庭"} / {formatGrade(child.grade)}
                      </p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                      {roleLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}