"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlannerContext } from "./PlannerContext";

function parseRuleKey(ruleKey: string): { kind: "group" | "pair"; id: string } | null {
  const [kind, id] = ruleKey.split(":");

  if ((kind !== "group" && kind !== "pair") || !id) {
    return null;
  }

  return { kind, id };
}

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
  const [editingRuleKey, setEditingRuleKey] = useState<string | null>(null);

  const editingRule = useMemo(() => {
    if (!editingRuleKey) {
      return null;
    }

    const parsed = parseRuleKey(editingRuleKey);

    if (!parsed) {
      return null;
    }

    if (parsed.kind === "group") {
      const rule = groupRules.find((item) => item.id === parsed.id);
      return rule ? { kind: "group" as const, rule } : null;
    }

    const rule = pairRules.find((item) => item.id === parsed.id);
    return rule ? { kind: "pair" as const, rule } : null;
  }, [editingRuleKey, groupRules, pairRules]);

  useEffect(() => {
    if (!editingRuleKey) {
      return;
    }

    if (!editingRule) {
      setEditingRuleKey(null);
    }
  }, [editingRule, editingRuleKey]);

  const closeModal = () => {
    setEditingRuleKey(null);
  };

  const removeEditingRule = () => {
    if (!editingRule) {
      return;
    }

    if (editingRule.kind === "group") {
      removeGroupRule(editingRule.rule.id);
    } else {
      removePairRule(editingRule.rule.id);
    }

    closeModal();
  };

  return (
    <>
      <div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addGroupRule}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            基本ルールを追加
          </button>
          <button
            type="button"
            onClick={addPairRule}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            児童の組み合わせを追加
          </button>
        </div>

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
                    className="flex items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => setEditingRuleKey(rule.key)}
                      className="min-w-0 flex-1 text-left"
                    >
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
                    </button>

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
      </div>

      {editingRule ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" onClick={closeModal}>
          <div className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-4 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.45)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    editingRule.kind === "group"
                      ? "bg-sky-100 text-sky-900"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {editingRule.kind === "group" ? "基本ルール" : "児童の組み合わせ"}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">ルール詳細</h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="ルール詳細を閉じる"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-xl leading-none text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
              >
                ×
              </button>
            </div>

            {editingRule.kind === "group" ? (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-stone-700">
                  ルール種別
                  <select
                    value={editingRule.rule.type}
                    onChange={(event) => updateGroupRule(editingRule.rule.id, "type", event.target.value)}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                  >
                    <option value="groupSize">班の人数</option>
                    <option value="leaderPosition">先頭の配置</option>
                    <option value="rearPosition">最後尾の配置</option>
                  </select>
                </label>

                {editingRule.rule.type === "groupSize" ? (
                  <>
                    <label className="space-y-1 text-sm font-medium text-stone-700">
                      最小人数
                      <input
                        type="number"
                        min={1}
                        value={editingRule.rule.minSize}
                        onChange={(event) => updateGroupRule(editingRule.rule.id, "minSize", event.target.value)}
                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-stone-700">
                      最大人数
                      <input
                        type="number"
                        min={1}
                        value={editingRule.rule.maxSize}
                        onChange={(event) => updateGroupRule(editingRule.rule.id, "maxSize", event.target.value)}
                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                      />
                    </label>
                  </>
                ) : (
                  <label className="space-y-1 text-sm font-medium text-stone-700">
                    配置方法
                    <select
                      value={editingRule.rule.strategy}
                      onChange={(event) => updateGroupRule(editingRule.rule.id, "strategy", event.target.value)}
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                    >
                      <option value="most-senior">最年長順に配置</option>
                      <option value="none">自動配置しない</option>
                    </select>
                  </label>
                )}

                <label className="space-y-1 text-sm font-medium text-stone-700 md:col-span-2">
                  メモ
                  <input
                    type="text"
                    value={editingRule.rule.note}
                    onChange={(event) => updateGroupRule(editingRule.rule.id, "note", event.target.value)}
                    placeholder="補足メモ"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-stone-700">
                  条件
                  <select
                    value={editingRule.rule.type}
                    onChange={(event) => updatePairRule(editingRule.rule.id, "type", event.target.value)}
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
                    value={editingRule.rule.note}
                    onChange={(event) => updatePairRule(editingRule.rule.id, "note", event.target.value)}
                    placeholder="事情の補足"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-base text-stone-900 outline-none transition focus:border-amber-500"
                  />
                </label>

                <label className="space-y-1 text-sm font-medium text-stone-700">
                  児童A
                  <select
                    value={editingRule.rule.childAId}
                    onChange={(event) => updatePairRule(editingRule.rule.id, "childAId", event.target.value)}
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
                    value={editingRule.rule.childBId}
                    onChange={(event) => updatePairRule(editingRule.rule.id, "childBId", event.target.value)}
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
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={removeEditingRule}
                className="rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-500 hover:text-rose-800"
              >
                このルールを削除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}