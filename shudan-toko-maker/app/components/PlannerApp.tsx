"use client";

import { PlannerProvider, usePlannerContext } from "./PlannerContext";
import { FlagDutyPlanPanel } from "./FlagDutyPlanPanel";
import { FlagDutySettingsPanel } from "./FlagDutySettingsPanel";
import { GroupPlanPanel } from "./GroupPlanPanel";
import { HouseholdFormSection } from "./HouseholdFormSection";
import { PairRulesPanel } from "./PairRulesPanel";
import { PlannerHero } from "./PlannerHero";
import { SchoolEventsPanel } from "./SchoolEventsPanel";

function PlannerContent() {
  const { activeTab, isPlanStale, generatePlans } = usePlannerContext();

  const handleGeneratePlans = () => {
    generatePlans();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#f4efe3_42%,#ebe7dc_100%)] px-4 py-8 pb-28 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PlannerHero />

        {activeTab === "input" && (
          <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <HouseholdFormSection />

            <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
              <PairRulesPanel />
              <SchoolEventsPanel />
              <FlagDutySettingsPanel />
            </div>
          </section>
        )}

        {activeTab === "results" && (
          <section className="grid gap-6 xl:grid-cols-2">
            <GroupPlanPanel />
            <FlagDutyPlanPanel />
          </section>
        )}
      </div>

      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={handleGeneratePlans}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-[0_14px_32px_-16px_rgba(0,0,0,0.5)] transition ${
            isPlanStale
              ? "bg-amber-400 text-stone-900 hover:bg-amber-300"
              : "bg-stone-900 text-white hover:bg-stone-700"
          }`}
        >
          班編成・当番表をつくる
          {isPlanStale && <span className="text-xs font-medium">未反映</span>}
        </button>
      </div>
    </main>
  );
}

export function PlannerApp() {
  return (
    <PlannerProvider>
      <PlannerContent />
    </PlannerProvider>
  );
}