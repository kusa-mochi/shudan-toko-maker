"use client";

import { usePlannerContext } from "./PlannerContext";

export function PlannerHero() {
  const {
    households,
    childCount,
    pairRules,
    schoolEvents,
    lastSavedAt,
    saveDraft,
  } = usePlannerContext();

  return (
    <section className="overflow-hidden rounded-[32px] border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_-32px_rgba(87,58,18,0.45)] backdrop-blur">
      <div className="grid gap-6 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="space-y-5">
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold tracking-[0.18em] text-amber-900">
            集団登校データ入力
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              家庭情報、個別事情、学校行事から、登校班表と旗当番表を自動生成します。
            </h1>
            <p className="text-sm leading-7 text-stone-600 sm:text-base">
              各家庭の児童構成と過去の旗当番回数を入力し、さらに「同じ班にしたい」「別々の班にしたい」といった事情や学校行事を登録できます。登校班は4〜5人を基本に、最年長の児童を先頭、その次に最年長の児童を最後尾へ順次配置する考え方で編成します。
            </p>
          </div>
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
              <p className="text-stone-500">個別事情</p>
              <p className="text-2xl font-semibold text-stone-900">{pairRules.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-stone-500">学校行事</p>
              <p className="text-2xl font-semibold text-stone-900">{schoolEvents.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-stone-500">入力状態</p>
              <p className="text-lg font-semibold text-stone-900">
                {lastSavedAt ? `${lastSavedAt} に更新` : "編集中"}
              </p>
            </div>
          </div>
        </div>

        {/* <aside className="rounded-[28px] bg-stone-900 p-6 text-stone-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <h2 className="text-lg font-semibold">この画面で扱う情報</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-300">
            <li>家庭ごとの保護者名、児童名、学年、旗当番回数</li>
            <li>児童同士を同班・別班にする個別事情</li>
            <li>学校行事の日付と対象学年</li>
            <li>旗当番表の開始日と生成週数</li>
          </ul>
          <button
            type="button"
            onClick={saveDraft}
            className="mt-6 w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-200"
          >
            現在の内容を更新表示
          </button>
        </aside> */}
      </div>
    </section>
  );
}