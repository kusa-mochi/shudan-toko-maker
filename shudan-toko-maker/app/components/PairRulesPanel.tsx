"use client";

import { usePlannerContext } from "./PlannerContext";

export function PairRulesPanel() {
  const { pairRules, childOptions, addPairRule, updatePairRule, removePairRule } =
    usePlannerContext();

  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/85 p-5 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-amber-700">RULES</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">個別事情</h2>
        </div>
        <button
          type="button"
          onClick={addPairRule}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          事情を追加
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        そりの合わない子は別班、兄弟や仲の良い子は同班、などを2人単位で登録できます。
      </p>

      <div className="mt-5 space-y-3">
        {pairRules.length === 0 ? (
          <p className="rounded-3xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            まだ個別事情はありません。必要な場合のみ追加してください。
          </p>
        ) : null}

        {pairRules.map((rule, ruleIndex) => (
          <div key={rule.id} className="rounded-3xl bg-stone-50 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-stone-700">
                条件
                <select
                  value={rule.type}
                  onChange={(event) => updatePairRule(rule.id, "type", event.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500"
                >
                  <option value="separate">別々の班にしたい</option>
                  <option value="together">同じ班にしたい</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700">
                メモ
                <input
                  type="text"
                  value={rule.note}
                  onChange={(event) => updatePairRule(rule.id, "note", event.target.value)}
                  placeholder={`事情 ${ruleIndex + 1} の補足`}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700">
                児童A
                <select
                  value={rule.childAId}
                  onChange={(event) => updatePairRule(rule.id, "childAId", event.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500"
                >
                  <option value="">児童を選択</option>
                  {childOptions.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700">
                児童B
                <select
                  value={rule.childBId}
                  onChange={(event) => updatePairRule(rule.id, "childBId", event.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500"
                >
                  <option value="">児童を選択</option>
                  {childOptions.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => removePairRule(rule.id)}
              className="mt-3 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
            >
              この事情を削除
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}