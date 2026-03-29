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
  const { activeTab } = usePlannerContext();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#f4efe3_42%,#ebe7dc_100%)] px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
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