"use client";

import { useEffect, useRef, useState } from "react";
import { usePlannerContext } from "./PlannerContext";
import { HouseholdEditorCard } from "./HouseholdEditorCard";

export function HouseholdFormSection() {
  const {
    households,
    addHousehold,
  } = usePlannerContext();
  const bottomAddButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isBottomAddVisible, setIsBottomAddVisible] = useState(true);

  useEffect(() => {
    const target = bottomAddButtonRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBottomAddVisible(entry.isIntersecting);
      },
      {
        threshold: 0.25,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [households.length]);

  const addButtonClassName =
    "flex items-center justify-center rounded-[28px] border border-dashed border-stone-400 bg-white/70 px-6 py-4 text-base font-semibold text-stone-800 transition hover:border-stone-900 hover:bg-white";

  return (
    <section className="space-y-4">
      <header className="rounded-[28px] border border-stone-200/90 bg-white/75 p-4 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">ご家庭情報</h2>
            <p className="mt-1 text-sm text-stone-600">
              現在 {households.length} 家庭を登録中。まずここを入力すると全体設定がしやすくなります。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={addHousehold}
              className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              + ご家庭を追加
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          {households.map((household, householdIndex) => (
            <div key={household.id} className="w-full md:basis-[calc(50%-0.375rem)] md:max-w-[calc(50%-0.375rem)]">
              <HouseholdEditorCard household={household} householdIndex={householdIndex} />
            </div>
          ))}
        </div>

        <button
          ref={bottomAddButtonRef}
          type="button"
          onClick={addHousehold}
          className={`${addButtonClassName} w-full`}
        >
          ご家庭を追加する
        </button>

        {!isBottomAddVisible ? (
          <div className="pointer-events-none fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
            <button
              type="button"
              onClick={addHousehold}
              className="pointer-events-auto inline-flex items-center rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-[0_14px_32px_-16px_rgba(0,0,0,0.5)] transition hover:bg-amber-300"
            >
              + ご家庭を追加
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}