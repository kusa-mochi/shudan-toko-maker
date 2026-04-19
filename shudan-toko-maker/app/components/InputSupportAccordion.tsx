"use client";

import { useState } from "react";
import { FlagDutySettingsPanel } from "./FlagDutySettingsPanel";
import { PairRulesPanel } from "./PairRulesPanel";
import { SchoolEventsPanel } from "./SchoolEventsPanel";

type SupportPanelKey = "rules" | "events" | "duty";

type SupportPanelItem = {
  key: SupportPanelKey;
  title: string;
  description: string;
};

const supportPanels: SupportPanelItem[] = [
  {
    key: "rules",
    title: "班編成ルール",
    description: "優先順位付きの基本ルールと児童の組み合わせを設定",
  },
  {
    key: "events",
    title: "学校行事",
    description: "行事がある日の対象学年を旗当番候補から除外",
  },
  {
    key: "duty",
    title: "旗当番表の生成条件",
    description: "開始日と生成週数を設定",
  },
];

function renderPanel(panelKey: SupportPanelKey) {
  if (panelKey === "rules") {
    return <PairRulesPanel />;
  }

  if (panelKey === "events") {
    return <SchoolEventsPanel />;
  }

  return <FlagDutySettingsPanel />;
}

export function InputSupportAccordion() {
  const [openPanel, setOpenPanel] = useState<SupportPanelKey | null>("rules");

  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/70 p-4 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] backdrop-blur sm:p-5">
      <header>
        <h2 className="text-2xl font-semibold text-stone-900">詳細条件</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          ご家庭情報の入力後に必要な項目だけ開いて設定できます。
        </p>
      </header>

      <div className="mt-4 space-y-3">
        {supportPanels.map((panel) => {
          const isOpen = openPanel === panel.key;

          return (
            <section
              key={panel.key}
              className="overflow-hidden rounded-3xl border border-stone-200 bg-white/75"
            >
              <button
                type="button"
                onClick={() => setOpenPanel((current) => (current === panel.key ? null : panel.key))}
                aria-expanded={isOpen}
                aria-controls={`support-panel-${panel.key}`}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5 shadow-none"
              >
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">{panel.title}</h3>
                  <p className="mt-1 text-sm text-stone-600">{panel.description}</p>
                </div>
                <span className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                  {isOpen ? "表示中" : "開く"}
                </span>
              </button>

              <div
                className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div
                  id={`support-panel-${panel.key}`}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                  className={`min-h-0 overflow-hidden px-3 sm:px-4 transition-[padding,opacity,visibility] duration-300 ease-out motion-reduce:transition-none ${
                    isOpen ? "visible pb-3 opacity-100 sm:pb-4" : "invisible pb-0 opacity-0 pointer-events-none"
                  }`}
                >
                  {renderPanel(panel.key)}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}