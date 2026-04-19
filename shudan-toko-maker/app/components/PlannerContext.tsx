"use client";

import {
  createContext,
  useContext,
  useEffect,
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
import {
  parsePlannerInputFromJson,
  serializePlannerInputToJson,
} from "./plannerJson";
import type {
  FlagDutyPlan,
  FlagDutySettings,
  Grade,
  GroupPlan,
  GroupRule,
  Household,
  PairRule,
  SchoolEvent,
} from "./plannerTypes";

type ChildOption = {
  id: string;
  label: string;
};

export type ActiveTab = "input" | "results";
export type RuleKind = "group" | "pair";

type RulePriorityItem = {
  key: string;
  kind: RuleKind;
  title: string;
  detail: string;
};

type JsonImportResult = {
  success: boolean;
  message: string;
};

function toRuleKey(kind: RuleKind, id: string): string {
  return `${kind}:${id}`;
}

function parseRuleKey(ruleKey: string): { kind: RuleKind; id: string } | null {
  const [kind, id] = ruleKey.split(":");

  if ((kind !== "group" && kind !== "pair") || !id) {
    return null;
  }

  return { kind, id };
}

function getNextIdNumberFromValues(values: string[], fallback: number): number {
  const maxValue = values.reduce((currentMax, value) => {
    const matched = value.match(/(\d+)(?!.*\d)/);

    if (!matched) {
      return currentMax;
    }

    const parsed = Number.parseInt(matched[1], 10);

    if (!Number.isFinite(parsed)) {
      return currentMax;
    }

    return Math.max(currentMax, parsed);
  }, fallback - 1);

  return Math.max(fallback, maxValue + 1);
}

function describeGroupRule(rule: GroupRule): string {
  if (rule.type === "groupSize") {
    return `班の人数を ${rule.minSize}〜${rule.maxSize} 人に設定`;
  }

  if (rule.type === "leaderPosition") {
    return rule.strategy === "none"
      ? "先頭の自動配置をしない"
      : "先頭を最年長順で配置";
  }

  return rule.strategy === "none"
    ? "最後尾の自動配置をしない"
    : "最後尾を最年長順で配置";
}

function describePairRule(rule: PairRule, childOptionMap: Map<string, string>): string {
  const relation = rule.type === "together" ? "同じ班" : "別々の班";
  const childA = childOptionMap.get(rule.childAId) ?? "児童A未選択";
  const childB = childOptionMap.get(rule.childBId) ?? "児童B未選択";
  return `${relation}: ${childA} / ${childB}`;
}

type PlannerContextValue = {
  households: Household[];
  pairRules: PairRule[];
  groupRules: GroupRule[];
  schoolEvents: SchoolEvent[];
  flagDutySettings: FlagDutySettings;
  lastSavedAt: string;
  childOptions: ChildOption[];
  childCount: number;
  groupPlan: GroupPlan;
  flagDutyPlan: FlagDutyPlan;
  isPlanStale: boolean;
  activeTab: ActiveTab;
  prioritizedRules: RulePriorityItem[];
  switchTab: (tab: ActiveTab) => void;
  moveRulePriority: (ruleKey: string, direction: "up" | "down") => void;
  generatePlans: () => void;
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
  addDutyLimit: (householdId: string) => void;
  updateDutyLimit: (householdId: string, maxCount: number) => void;
  removeDutyLimit: (householdId: string) => void;
  exportInputToJson: () => void;
  importInputFromJson: (jsonText: string) => JsonImportResult;
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
  const [rulePriorityOrder, setRulePriorityOrder] = useState<string[]>([
    ...demoState.groupRules.map((rule) => toRuleKey("group", rule.id)),
    ...demoState.pairRules.map((rule) => toRuleKey("pair", rule.id)),
  ]);
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>(demoState.schoolEvents);
  const [flagDutySettings, setFlagDutySettings] = useState<FlagDutySettings>(
    demoState.flagDutySettings,
  );
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [groupPlan, setGroupPlan] = useState<GroupPlan>(() =>
    generateSchoolGroups(demoState.households, demoState.pairRules, demoState.groupRules),
  );
  const [flagDutyPlan, setFlagDutyPlan] = useState<FlagDutyPlan>(() =>
    generateFlagDutySchedule(demoState.households, demoState.schoolEvents, demoState.flagDutySettings),
  );
  const [isPlanStale, setIsPlanStale] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("input");
  const isFirstRender = useRef(true);

  useEffect(() => {
    setRulePriorityOrder((current) => {
      const validKeys = [
        ...groupRules.map((rule) => toRuleKey("group", rule.id)),
        ...pairRules.map((rule) => toRuleKey("pair", rule.id)),
      ];
      const validKeySet = new Set(validKeys);
      const filteredCurrent = current.filter((ruleKey, index) => {
        if (!validKeySet.has(ruleKey)) {
          return false;
        }

        return current.indexOf(ruleKey) === index;
      });

      const missingKeys = validKeys.filter((ruleKey) => !filteredCurrent.includes(ruleKey));
      const next = [...filteredCurrent, ...missingKeys];

      if (next.length === current.length && next.every((ruleKey, index) => ruleKey === current[index])) {
        return current;
      }

      return next;
    });
  }, [groupRules, pairRules]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsPlanStale(true);
  }, [households, pairRules, groupRules, rulePriorityOrder, schoolEvents, flagDutySettings]);

  const childRecords = getAllChildRecords(households);
  const childOptions = childRecords
    .slice()
    .sort(compareChildrenBySeniority)
    .map((child) => ({
      id: child.id,
      label: `${child.householdName || "未入力のご家庭"} / ${displayChildName(child)}`,
    }));

  const childOptionMap = new Map(childOptions.map((child) => [child.id, child.label]));
  const pairRuleMap = new Map(pairRules.map((rule) => [rule.id, rule]));
  const groupRuleMap = new Map(groupRules.map((rule) => [rule.id, rule]));

  const prioritizedRules: RulePriorityItem[] = [];
  const orderedPairRules: PairRule[] = [];
  const orderedGroupRules: GroupRule[] = [];
  const seenPairRuleIds = new Set<string>();
  const seenGroupRuleIds = new Set<string>();

  rulePriorityOrder.forEach((ruleKey) => {
    const parsed = parseRuleKey(ruleKey);

    if (!parsed) {
      return;
    }

    if (parsed.kind === "pair") {
      const rule = pairRuleMap.get(parsed.id);

      if (!rule || seenPairRuleIds.has(rule.id)) {
        return;
      }

      seenPairRuleIds.add(rule.id);
      orderedPairRules.push(rule);
      prioritizedRules.push({
        key: toRuleKey("pair", rule.id),
        kind: "pair",
        title: "児童の組み合わせ",
        detail: describePairRule(rule, childOptionMap),
      });
      return;
    }

    const rule = groupRuleMap.get(parsed.id);

    if (!rule || seenGroupRuleIds.has(rule.id)) {
      return;
    }

    seenGroupRuleIds.add(rule.id);
    orderedGroupRules.push(rule);
    prioritizedRules.push({
      key: toRuleKey("group", rule.id),
      kind: "group",
      title: "基本ルール",
      detail: describeGroupRule(rule),
    });
  });

  groupRules.forEach((rule) => {
    if (seenGroupRuleIds.has(rule.id)) {
      return;
    }

    orderedGroupRules.push(rule);
    prioritizedRules.push({
      key: toRuleKey("group", rule.id),
      kind: "group",
      title: "基本ルール",
      detail: describeGroupRule(rule),
    });
  });

  pairRules.forEach((rule) => {
    if (seenPairRuleIds.has(rule.id)) {
      return;
    }

    orderedPairRules.push(rule);
    prioritizedRules.push({
      key: toRuleKey("pair", rule.id),
      kind: "pair",
      title: "児童の組み合わせ",
      detail: describePairRule(rule, childOptionMap),
    });
  });

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
    setRulePriorityOrder((current) => [...current, toRuleKey("pair", ruleId)]);
  };

  const updatePairRule = (ruleId: string, field: keyof PairRule, value: string) => {
    setPairRules((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, [field]: value } : rule)),
    );
  };

  const removePairRule = (ruleId: string) => {
    setPairRules((current) => current.filter((rule) => rule.id !== ruleId));
    setRulePriorityOrder((current) => current.filter((ruleKey) => ruleKey !== toRuleKey("pair", ruleId)));
  };

  const addGroupRule = () => {
    const ruleId = `group-rule-${groupRuleIdRef.current}`;
    groupRuleIdRef.current += 1;
    setGroupRules((current) => [...current, createGroupRule(ruleId)]);
    setRulePriorityOrder((current) => [...current, toRuleKey("group", ruleId)]);
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
    setRulePriorityOrder((current) => current.filter((ruleKey) => ruleKey !== toRuleKey("group", ruleId)));
  };

  const moveRulePriority = (ruleKey: string, direction: "up" | "down") => {
    setRulePriorityOrder((current) => {
      const currentIndex = current.indexOf(ruleKey);

      if (currentIndex < 0) {
        return current;
      }

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [picked] = next.splice(currentIndex, 1);

      if (!picked) {
        return current;
      }

      next.splice(targetIndex, 0, picked);
      return next;
    });
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
      [field]: value,
    }));
  };

  const addDutyLimit = (householdId: string) => {
    setFlagDutySettings((current) => {
      if (current.dutyLimits.some((limit) => limit.householdId === householdId)) {
        return current;
      }

      return {
        ...current,
        dutyLimits: [...current.dutyLimits, { householdId, maxCount: 1 }],
      };
    });
  };

  const updateDutyLimit = (householdId: string, maxCount: number) => {
    setFlagDutySettings((current) => ({
      ...current,
      dutyLimits: current.dutyLimits.map((limit) =>
        limit.householdId === householdId ? { ...limit, maxCount } : limit,
      ),
    }));
  };

  const removeDutyLimit = (householdId: string) => {
    setFlagDutySettings((current) => ({
      ...current,
      dutyLimits: current.dutyLimits.filter((limit) => limit.householdId !== householdId),
    }));
  };

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const exportInputToJson = () => {
    const jsonText = serializePlannerInputToJson({
      households,
      pairRules,
      groupRules,
      rulePriorityOrder,
      schoolEvents,
      flagDutySettings,
    });

    const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:]/g, "-").replace(/\..+$/, "");

    link.href = downloadUrl;
    link.download = `shudan-toko-input-${timestamp}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  };

  const importInputFromJson = (jsonText: string): JsonImportResult => {
    try {
      const imported = parsePlannerInputFromJson(jsonText);
      const nextRulePriorityOrder =
        imported.rulePriorityOrder.length > 0
          ? imported.rulePriorityOrder
          : [
              ...imported.groupRules.map((rule) => toRuleKey("group", rule.id)),
              ...imported.pairRules.map((rule) => toRuleKey("pair", rule.id)),
            ];

      setHouseholds(imported.households);
      setPairRules(imported.pairRules);
      setGroupRules(imported.groupRules);
      setRulePriorityOrder(nextRulePriorityOrder);
      setSchoolEvents(imported.schoolEvents);
      setFlagDutySettings(imported.flagDutySettings);
      setIsPlanStale(true);
      setActiveTab("input");
      setLastSavedAt("");

      householdIdRef.current = getNextIdNumberFromValues(
        imported.households.map((household) => household.id),
        householdIdRef.current,
      );
      childIdRef.current = getNextIdNumberFromValues(
        imported.households.flatMap((household) => household.children.map((child) => child.id)),
        childIdRef.current,
      );
      pairRuleIdRef.current = getNextIdNumberFromValues(
        imported.pairRules.map((rule) => rule.id),
        pairRuleIdRef.current,
      );
      groupRuleIdRef.current = getNextIdNumberFromValues(
        imported.groupRules.map((rule) => rule.id),
        groupRuleIdRef.current,
      );
      schoolEventIdRef.current = getNextIdNumberFromValues(
        imported.schoolEvents.map((eventItem) => eventItem.id),
        schoolEventIdRef.current,
      );

      return {
        success: true,
        message: "JSONを読み込みました。入力内容を反映しています。",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "JSON読込に失敗しました。";

      return {
        success: false,
        message: `JSON読込に失敗しました: ${errorMessage}`,
      };
    }
  };

  const generatePlans = () => {
    setGroupPlan(generateSchoolGroups(households, orderedPairRules, orderedGroupRules));
    setFlagDutyPlan(generateFlagDutySchedule(households, schoolEvents, flagDutySettings));
    setIsPlanStale(false);
    setActiveTab("results");
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
    groupPlan,
    flagDutyPlan,
    isPlanStale,
    activeTab,
    prioritizedRules,
    switchTab,
    moveRulePriority,
    generatePlans,
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
    addDutyLimit,
    updateDutyLimit,
    removeDutyLimit,
    exportInputToJson,
    importInputFromJson,
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