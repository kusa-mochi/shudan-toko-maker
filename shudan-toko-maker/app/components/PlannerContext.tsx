"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createDemoPlannerState } from "./plannerDemoData";
import {
  compareChildrenBySeniority,
  createChild,
  createGroupRule,
  createHousehold,
  createPairRule,
  createSchoolEvent,
  displayChildName,
  generateFlagDutySchedule,
  generateSchoolGroups,
  getAllChildRecords,
} from "./plannerUtils";
import type {
  FlagDutySettings,
  Grade,
  GroupRule,
  Household,
  PairRule,
  SchoolEvent,
} from "./plannerTypes";

type ChildOption = {
  id: string;
  label: string;
};

type PlannerContextValue = {
  households: Household[];
  pairRules: PairRule[];
  groupRules: GroupRule[];
  schoolEvents: SchoolEvent[];
  flagDutySettings: FlagDutySettings;
  lastSavedAt: string;
  childOptions: ChildOption[];
  childCount: number;
  groupPlan: ReturnType<typeof generateSchoolGroups>;
  flagDutyPlan: ReturnType<typeof generateFlagDutySchedule>;
  saveDraft: () => void;
  addHousehold: () => void;
  removeHousehold: (householdId: string) => void;
  updateHouseholdText: (
    householdId: string,
    field: "householdName" | "memo",
    value: string,
  ) => void;
  updateHouseholdDutyCount: (householdId: string, value: string) => void;
  addChild: (householdId: string) => void;
  updateChildName: (householdId: string, childId: string, name: string) => void;
  updateChildGrade: (householdId: string, childId: string, grade: Grade) => void;
  removeChild: (householdId: string, childId: string) => void;
  addPairRule: () => void;
  updatePairRule: (ruleId: string, field: keyof PairRule, value: string) => void;
  removePairRule: (ruleId: string) => void;
  addGroupRule: () => void;
  updateGroupRule: (ruleId: string, field: keyof GroupRule, value: string) => void;
  removeGroupRule: (ruleId: string) => void;
  addSchoolEvent: () => void;
  updateSchoolEventText: (
    eventId: string,
    field: "title" | "date",
    value: string,
  ) => void;
  toggleEventGrade: (eventId: string, grade: Grade) => void;
  removeSchoolEvent: (eventId: string) => void;
  updateFlagDutySetting: (field: keyof FlagDutySettings, value: string) => void;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const demoState = useRef(createDemoPlannerState()).current;
  const householdIdRef = useRef(demoState.nextIds.household);
  const childIdRef = useRef(demoState.nextIds.child);
  const pairRuleIdRef = useRef(demoState.nextIds.pairRule);
  const groupRuleIdRef = useRef(demoState.nextIds.groupRule);
  const schoolEventIdRef = useRef(demoState.nextIds.schoolEvent);

  const [households, setHouseholds] = useState<Household[]>(demoState.households);
  const [pairRules, setPairRules] = useState<PairRule[]>(demoState.pairRules);
  const [groupRules, setGroupRules] = useState<GroupRule[]>(demoState.groupRules);
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
    console.log("Adding child to household:", householdId);
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

  const addGroupRule = () => {
    const ruleId = `group-rule-${groupRuleIdRef.current}`;
    groupRuleIdRef.current += 1;
    setGroupRules((current) => [...current, createGroupRule(ruleId)]);
  };

  const updateGroupRule = (ruleId: string, field: keyof GroupRule, value: string) => {
    setGroupRules((current) =>
      current.map((rule) => {
        if (rule.id !== ruleId) {
          return rule;
        }

        if (field === "minSize" || field === "maxSize") {
          return { ...rule, [field]: Math.max(1, Number.parseInt(value || "1", 10) || 1) };
        }

        return { ...rule, [field]: value };
      }),
    );
  };

  const removeGroupRule = (ruleId: string) => {
    setGroupRules((current) => current.filter((rule) => rule.id !== ruleId));
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

  const value: PlannerContextValue = {
    households,
    pairRules,
    groupRules,
    schoolEvents,
    flagDutySettings,
    lastSavedAt,
    childOptions,
    childCount: childRecords.length,
    groupPlan: generateSchoolGroups(households, pairRules, groupRules),
    flagDutyPlan: generateFlagDutySchedule(households, schoolEvents, flagDutySettings),
    saveDraft,
    addHousehold,
    removeHousehold,
    updateHouseholdText,
    updateHouseholdDutyCount,
    addChild,
    updateChildName,
    updateChildGrade,
    removeChild,
    addPairRule,
    updatePairRule,
    removePairRule,
    addGroupRule,
    updateGroupRule,
    removeGroupRule,
    addSchoolEvent,
    updateSchoolEventText,
    toggleEventGrade,
    removeSchoolEvent,
    updateFlagDutySetting,
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlannerContext() {
  const context = useContext(PlannerContext);

  if (!context) {
    throw new Error("usePlannerContext must be used within PlannerProvider");
  }

  return context;
}