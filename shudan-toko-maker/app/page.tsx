"use client";

import { useRef, useState } from "react";
import { FlagDutyPlanPanel } from "./components/FlagDutyPlanPanel";
import { FlagDutySettingsPanel } from "./components/FlagDutySettingsPanel";
import { GroupPlanPanel } from "./components/GroupPlanPanel";
import { HouseholdFormSection } from "./components/HouseholdFormSection";
import { HouseholdPreviewPanel } from "./components/HouseholdPreviewPanel";
import { PairRulesPanel } from "./components/PairRulesPanel";
import { PlannerHero } from "./components/PlannerHero";
import { SchoolEventsPanel } from "./components/SchoolEventsPanel";
import { createDemoPlannerState } from "./components/plannerDemoData";
import {
  compareChildrenBySeniority,
  createChild,
  createHousehold,
  createPairRule,
  createSchoolEvent,
  displayChildName,
  generateFlagDutySchedule,
  generateSchoolGroups,
  getAllChildRecords,
} from "./components/plannerUtils";
import type {
  FlagDutySettings,
  Grade,
  Household,
  PairRule,
  SchoolEvent,
} from "./components/plannerTypes";

export default function Home() {
  const demoState = useRef(createDemoPlannerState()).current;
  const householdIdRef = useRef(demoState.nextIds.household);
  const childIdRef = useRef(demoState.nextIds.child);
  const pairRuleIdRef = useRef(demoState.nextIds.pairRule);
  const schoolEventIdRef = useRef(demoState.nextIds.schoolEvent);

  const [households, setHouseholds] = useState<Household[]>(demoState.households);
  const [pairRules, setPairRules] = useState<PairRule[]>(demoState.pairRules);
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>(demoState.schoolEvents);
  const [flagDutySettings, setFlagDutySettings] = useState<FlagDutySettings>(
    demoState.flagDutySettings,
  );
  const [lastSavedAt, setLastSavedAt] = useState("");

  const childRecords = getAllChildRecords(households);
  const childOptions = childRecords
    .slice()
    .sort(compareChildrenBySeniority)
    .map((child) => ({
      id: child.id,
      label: `${child.householdName || "未入力のご家庭"} / ${displayChildName(child)}`,
    }));

  const removeRulesForChildIds = (childIds: string[]) => {
    const childIdSet = new Set(childIds);
    setPairRules((current) =>
      current.filter((rule) => !childIdSet.has(rule.childAId) && !childIdSet.has(rule.childBId)),
    );
  };

  const updateHouseholdText = (
    householdId: string,
    field: "householdName" | "memo",
    value: string,
  ) => {
    setHouseholds((current) =>
      current.map((household) =>
        household.id === householdId ? { ...household, [field]: value } : household,
      ),
    );
  };

  const updateHouseholdDutyCount = (householdId: string, value: string) => {
    const parsedValue = Math.max(0, Number.parseInt(value || "0", 10) || 0);

    setHouseholds((current) =>
      current.map((household) =>
        household.id === householdId ? { ...household, pastDutyCount: parsedValue } : household,
      ),
    );
  };

  const addHousehold = () => {
    const householdId = `household-${householdIdRef.current}`;
    householdIdRef.current += 1;
    const childId = `child-${childIdRef.current}`;
    childIdRef.current += 1;

    setHouseholds((current) => [...current, createHousehold(householdId, childId)]);
  };

  const removeHousehold = (householdId: string) => {
    const householdToRemove = households.find((household) => household.id === householdId);

    if (householdToRemove) {
      removeRulesForChildIds(householdToRemove.children.map((child) => child.id));
    }

    setHouseholds((current) => {
      if (current.length === 1) {
        const nextHouseholdId = `household-${householdIdRef.current}`;
        householdIdRef.current += 1;
        const nextChildId = `child-${childIdRef.current}`;
        childIdRef.current += 1;

        return [createHousehold(nextHouseholdId, nextChildId)];
      }

      return current.filter((household) => household.id !== householdId);
    });
  };

  const addChild = (householdId: string) => {
    const childId = `child-${childIdRef.current}`;
    childIdRef.current += 1;

    setHouseholds((current) =>
      current.map((household) =>
        household.id === householdId
          ? { ...household, children: [...household.children, createChild(childId)] }
          : household,
      ),
    );
  };

  const updateChildName = (householdId: string, childId: string, name: string) => {
    setHouseholds((current) =>
      current.map((household) =>
        household.id === householdId
          ? {
              ...household,
              children: household.children.map((child) =>
                child.id === childId ? { ...child, name } : child,
              ),
            }
          : household,
      ),
    );
  };

  const updateChildGrade = (householdId: string, childId: string, grade: Grade) => {
    setHouseholds((current) =>
      current.map((household) =>
        household.id === householdId
          ? {
              ...household,
              children: household.children.map((child) =>
                child.id === childId ? { ...child, grade } : child,
              ),
            }
          : household,
      ),
    );
  };

  const removeChild = (householdId: string, childId: string) => {
    removeRulesForChildIds([childId]);

    const replacementChildId = `child-${childIdRef.current}`;
    childIdRef.current += 1;

    setHouseholds((current) =>
      current.map((household) => {
        if (household.id !== householdId) {
          return household;
        }

        const nextChildren = household.children.filter((child) => child.id !== childId);

        return {
          ...household,
          children: nextChildren.length > 0 ? nextChildren : [createChild(replacementChildId)],
        };
      }),
    );
  };

  const addPairRule = () => {
    const ruleId = `pair-rule-${pairRuleIdRef.current}`;
    pairRuleIdRef.current += 1;
    setPairRules((current) => [...current, createPairRule(ruleId, childRecords)]);
  };

  const updatePairRule = (ruleId: string, field: keyof PairRule, value: string) => {
    setPairRules((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, [field]: value } : rule)),
    );
  };

  const removePairRule = (ruleId: string) => {
    setPairRules((current) => current.filter((rule) => rule.id !== ruleId));
  };

  const addSchoolEvent = () => {
    const eventId = `school-event-${schoolEventIdRef.current}`;
    schoolEventIdRef.current += 1;
    setSchoolEvents((current) => [...current, createSchoolEvent(eventId)]);
  };

  const updateSchoolEventText = (
    eventId: string,
    field: "title" | "date",
    value: string,
  ) => {
    setSchoolEvents((current) =>
      current.map((eventItem) =>
        eventItem.id === eventId ? { ...eventItem, [field]: value } : eventItem,
      ),
    );
  };

  const toggleEventGrade = (eventId: string, grade: Grade) => {
    setSchoolEvents((current) =>
      current.map((eventItem) => {
        if (eventItem.id !== eventId) {
          return eventItem;
        }

        const nextGrades = eventItem.targetGrades.includes(grade)
          ? eventItem.targetGrades.filter((item) => item !== grade)
          : [...eventItem.targetGrades, grade].sort((left, right) => left - right);

        return {
          ...eventItem,
          targetGrades: nextGrades,
        };
      }),
    );
  };

  const removeSchoolEvent = (eventId: string) => {
    setSchoolEvents((current) => current.filter((eventItem) => eventItem.id !== eventId));
  };

  const updateFlagDutySetting = (field: keyof FlagDutySettings, value: string) => {
    setFlagDutySettings((current) => ({
      ...current,
      [field]: field === "weeks" ? Math.max(1, Number.parseInt(value || "1", 10) || 1) : value,
    }));
  };

  const saveDraft = () => {
    setLastSavedAt(
      new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
    );
  };

  const groupPlan = generateSchoolGroups(households, pairRules);
  const flagDutyPlan = generateFlagDutySchedule(households, schoolEvents, flagDutySettings);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#f4efe3_42%,#ebe7dc_100%)] px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PlannerHero
          householdCount={households.length}
          childCount={childRecords.length}
          pairRuleCount={pairRules.length}
          schoolEventCount={schoolEvents.length}
          lastSavedAt={lastSavedAt}
          onSaveDraft={saveDraft}
        />

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <HouseholdFormSection
            households={households}
            onAddHousehold={addHousehold}
            onRemoveHousehold={removeHousehold}
            onUpdateHouseholdText={updateHouseholdText}
            onUpdateHouseholdDutyCount={updateHouseholdDutyCount}
            onAddChild={addChild}
            onUpdateChildName={updateChildName}
            onUpdateChildGrade={updateChildGrade}
            onRemoveChild={removeChild}
          />

          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <HouseholdPreviewPanel households={households} />
            <PairRulesPanel
              pairRules={pairRules}
              childOptions={childOptions}
              onAddPairRule={addPairRule}
              onUpdatePairRule={updatePairRule}
              onRemovePairRule={removePairRule}
            />
            <SchoolEventsPanel
              schoolEvents={schoolEvents}
              onAddSchoolEvent={addSchoolEvent}
              onUpdateSchoolEventText={updateSchoolEventText}
              onToggleEventGrade={toggleEventGrade}
              onRemoveSchoolEvent={removeSchoolEvent}
            />
            <FlagDutySettingsPanel
              flagDutySettings={flagDutySettings}
              onUpdateFlagDutySetting={updateFlagDutySetting}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <GroupPlanPanel groupPlan={groupPlan} />
          <FlagDutyPlanPanel flagDutyPlan={flagDutyPlan} />
        </section>
      </div>
    </main>
  );
}