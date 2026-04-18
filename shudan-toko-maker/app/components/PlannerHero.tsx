"use client";

import { usePlannerContext } from "./PlannerContext";

export function PlannerHero() {
  const {
    households,
    childCount,
    pairRules,
    groupRules,
    schoolEvents,
    lastSavedAt,
    activeTab,
    switchTab,
  } = usePlannerContext();

  return (
    <section className="overflow-hidden rounded-[32px] border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_-32px_rgba(87,58,18,0.45)] backdrop-blur">
      <div className="grid gap-6 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="space-y-5">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              登校班・旗当番表メーカー
            </h1>
          </div>

          {/* タブナビゲーション */}
          <nav className="space-y-2" aria-label="表示切り替え">
            <div className="relative grid grid-cols-2 rounded-2xl border border-stone-200 bg-stone-100 p-1">
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-[0_10px_24px_-16px_rgba(28,25,23,0.7)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  activeTab === "results" ? "translate-x-full" : "translate-x-0"
                }`}
              />

              <button
                type="button"
                onClick={() => switchTab("input")}
                className={`relative z-10 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-none transition-colors hover:translate-y-0 hover:shadow-none active:translate-y-0 active:shadow-none ${
                  activeTab === "input"
                    ? "text-stone-900"
                    : "text-stone-500 hover:text-stone-700"
                }`}
                aria-pressed={activeTab === "input"}
              >
                データ入力
              </button>

              <button
                type="button"
                onClick={() => switchTab("results")}
                className={`relative z-10 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-none transition-colors hover:translate-y-0 hover:shadow-none active:translate-y-0 active:shadow-none ${
                  activeTab === "results"
                    ? "text-stone-900"
                    : "text-stone-500 hover:text-stone-700"
                }`}
                aria-pressed={activeTab === "results"}
              >
                生成結果
              </button>
            </div>

            {lastSavedAt && (
              <p className="pl-2 text-xs font-medium text-stone-500">
                最終更新: {lastSavedAt}
              </p>
            )}
          </nav>

          <div className="flex flex-wrap gap-3 text-sm text-stone-700">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-stone-500">登録家庭数</p>
              <p className="text-2xl font-semibold text-stone-900">{households.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-stone-500">登録児童数</p>
              <p className="text-2xl font-semibold text-stone-900">{childCount}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-stone-500">児童の組み合わせルール</p>
              <p className="text-2xl font-semibold text-stone-900">{pairRules.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-stone-500">学校行事</p>
              <p className="text-2xl font-semibold text-stone-900">{schoolEvents.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-stone-500">班編成の基本ルール</p>
              <p className="text-2xl font-semibold text-stone-900">{groupRules.length}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}