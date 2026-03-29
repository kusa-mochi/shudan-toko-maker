"use client";

import { usePlannerContext } from "./PlannerContext";

export function PairRulesPanel() {
  const {
    pairRules,
    childOptions,
    prioritizedRules,
    moveRulePriority,
    addPairRule,
    updatePairRule,
    removePairRule,
    groupRules,
    addGroupRule,
    updateGroupRule,
    removeGroupRule,
  } = usePlannerContext();

  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/85 p-4 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] backdrop-blur sm:p-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900">班編成ルール</h2>
      </div>
      <p className="mt-2 text-sm leading-5 text-stone-600">
        登校班の編成条件と、児童ごとの組み合わせ事情を設定できます。
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900">ルール優先順位</h3>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            上ほど優先
          </span>
        </div>

        {prioritizedRules.length === 0 ? (
          <p className="mt-2 rounded-3xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
            まだ優先順位を付けるルールがありません。
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {prioritizedRules.map((rule, index) => {
              const isFirst = index === 0;
              const isLast = index === prioritizedRules.length - 1;

              return (
                <div
                  key={rule.key}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs text-white">
                        {index + 1}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          rule.kind === "group"
                            ? "bg-sky-100 text-sky-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {rule.title}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-sm text-stone-600">{rule.detail}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveRulePriority(rule.key, "up")}
                      disabled={isFirst}
                      className="rounded-xl border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-700 transition hover:border-stone-900 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRulePriority(rule.key, "down")}
                      disabled={isLast}
                      className="rounded-xl border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-700 transition hover:border-stone-900 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 基本ルール */}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900">基本ルール</h3>
          <button
            type="button"
            onClick={addGroupRule}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            ルールを追加
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {groupRules.length === 0 ? (
            <p className="rounded-3xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
              基本ルールはありません。デフォルト値（4〜5人、最年長順に先頭・最後尾配置）が使用されます。
            </p>
          ) : null}

          {groupRules.map((rule) => (
            <div key={rule.id} className="rounded-3xl bg-stone-50 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-stone-700">
                  ルール種別
                  <select
                    value={rule.type}
                    onChange={(event) => updateGroupRule(rule.id, "type", event.target.value)}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                  >
                    <option value="groupSize">班の人数</option>
                    <option value="leaderPosition">先頭の配置</option>
                    <option value="rearPosition">最後尾の配置</option>
                  </select>
                </label>

                {rule.type === "groupSize" ? (
                  <>
                    <label className="space-y-1 text-sm font-medium text-stone-700">
                      最小人数
                      <input
                        type="number"
                        min={1}
                        value={rule.minSize}
                        onChange={(event) => updateGroupRule(rule.id, "minSize", event.target.value)}
                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-stone-700">
                      最大人数
                      <input
                        type="number"
                        min={1}
                        value={rule.maxSize}
                        onChange={(event) => updateGroupRule(rule.id, "maxSize", event.target.value)}
                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                      />
                    </label>
                  </>
                ) : (
                  <label className="space-y-1 text-sm font-medium text-stone-700">
                    配置方法
                    <select
                      value={rule.strategy}
                      onChange={(event) => updateGroupRule(rule.id, "strategy", event.target.value)}
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                    >
                      <option value="most-senior">最年長順に配置</option>
                      <option value="none">自動配置しない</option>
                    </select>
                  </label>
                )}

                <label className="space-y-1 text-sm font-medium text-stone-700">
                  メモ
                  <input
                    type="text"
                    value={rule.note}
                    onChange={(event) => updateGroupRule(rule.id, "note", event.target.value)}
                    placeholder="補足メモ"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => removeGroupRule(rule.id)}
                className="mt-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
              >
                このルールを削除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 児童の組み合わせ */}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900">児童の組み合わせ</h3>
          <button
            type="button"
            onClick={addPairRule}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            事情を追加
          </button>
        </div>
        <p className="mt-2 text-sm leading-5 text-stone-600">
          別班にしたい児童の組合せ、同班にしたい児童の組合せ、などを登録できます。
        </p>

        <div className="mt-2 space-y-2">
          {pairRules.length === 0 ? (
            <p className="rounded-3xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
              まだ組み合わせ事情はありません。必要な場合のみ追加してください。
            </p>
          ) : null}

          {pairRules.map((rule, ruleIndex) => (
            <div key={rule.id} className="rounded-3xl bg-stone-50 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-stone-700">
                  条件
                  <select
                    value={rule.type}
                    onChange={(event) => updatePairRule(rule.id, "type", event.target.value)}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                  >
                    <option value="separate">別々の班にしたい</option>
                    <option value="together">同じ班にしたい</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm font-medium text-stone-700">
                  メモ
                  <input
                    type="text"
                    value={rule.note}
                    onChange={(event) => updatePairRule(rule.id, "note", event.target.value)}
                    placeholder={`事情 ${ruleIndex + 1} の補足`}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                  />
                </label>

                <label className="space-y-1 text-sm font-medium text-stone-700">
                  児童A
                  <select
                    value={rule.childAId}
                    onChange={(event) => updatePairRule(rule.id, "childAId", event.target.value)}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                  >
                    <option value="">児童を選択</option>
                    {childOptions.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm font-medium text-stone-700">
                  児童B
                  <select
                    value={rule.childBId}
                    onChange={(event) => updatePairRule(rule.id, "childBId", event.target.value)}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
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
                className="mt-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
              >
                この事情を削除
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}