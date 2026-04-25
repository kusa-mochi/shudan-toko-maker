import type {
  Child,
  ChildRecord,
  FlagDutyPlan,
  FlagDutySettings,
  FlagDutySlot,
  GeneratedGroup,
  Grade,
  GroupPlan,
  GroupRule,
  Household,
  PairRule,
  SchoolEvent,
} from "./plannerTypes";

type GroupComponent = {
  members: ChildRecord[];
};

type InternalGroup = {
  index: number;
  targetSize: number;
  leader?: ChildRecord;
  rear?: ChildRecord;
  middle: ChildRecord[];
};

export function createChild(id: string): Child {
  return {
    id,
    name: "",
    grade: 1,
  };
}

export function createHousehold(householdId: string, childId: string): Household {
  return {
    id: householdId,
    addressOrRoom: "",
    householdName: "",
    memo: "",
    pastDutyCount: 0,
    children: [createChild(childId)],
  };
}

export function formatHouseholdLabel(
  household: Pick<Household, "addressOrRoom" | "householdName">,
): string {
  const address = household.addressOrRoom.trim();
  const name = household.householdName.trim();

  if (name && address) {
    return `${name} (${address})`;
  }

  if (name) {
    return name;
  }

  if (address) {
    return address;
  }

  return "未入力のご家庭";
}

export function createPairRule(id: string, children: ChildRecord[]): PairRule {
  return {
    id,
    type: "separate",
    childAId: children[0]?.id ?? "",
    childBId: children[1]?.id ?? "",
    note: "",
  };
}

export function createSchoolEvent(id: string): SchoolEvent {
  return {
    id,
    title: "",
    date: "",
    targetGrades: [6],
  };
}

export function createGroupRule(id: string): GroupRule {
  return {
    id,
    type: "groupSize",
    minSize: 4,
    maxSize: 5,
    strategy: "most-senior",
    note: "",
  };
}

export function formatGrade(grade: Grade): string {
  return `${grade}年`;
}

export function displayChildName(child: Pick<ChildRecord, "name" | "grade">): string {
  return `${child.name || "氏名未入力"} (${formatGrade(child.grade)})`;
}

export function compareChildrenBySeniority(a: ChildRecord, b: ChildRecord): number {
  if (a.grade !== b.grade) {
    return b.grade - a.grade;
  }

  const householdAddressComparison = a.addressOrRoom.localeCompare(b.addressOrRoom, "ja");

  if (householdAddressComparison !== 0) {
    return householdAddressComparison;
  }

  const householdComparison = a.householdName.localeCompare(b.householdName, "ja");

  if (householdComparison !== 0) {
    return householdComparison;
  }

  return a.name.localeCompare(b.name, "ja");
}

export function getAllChildRecords(households: Household[]): ChildRecord[] {
  return households.flatMap((household) =>
    household.children.map((child) => ({
      id: child.id,
      name: child.name,
      grade: child.grade,
      householdId: household.id,
      addressOrRoom: household.addressOrRoom,
      householdName: household.householdName,
    })),
  );
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string) {
  const existing = map.get(key);

  if (existing) {
    existing.add(value);
    return;
  }

  map.set(key, new Set([value]));
}

function getGroupMembers(group: InternalGroup): ChildRecord[] {
  return [
    ...(group.leader ? [group.leader] : []),
    ...group.middle,
    ...(group.rear ? [group.rear] : []),
  ];
}

function buildRuleMaps(children: ChildRecord[], rules: PairRule[]) {
  const childrenById = new Map(children.map((child) => [child.id, child]));
  const togetherMap = new Map<string, Set<string>>();
  const separateMap = new Map<string, Set<string>>();
  const appliedPairRuleTypeByKey = new Map<string, { type: PairRule["type"]; index: number }>();
  const warnings: string[] = [];

  rules.forEach((rule, index) => {
    const childA = childrenById.get(rule.childAId);
    const childB = childrenById.get(rule.childBId);

    if (!childA || !childB) {
      warnings.push(`個別事情 ${index + 1} は児童の選択が不足しているため、班編成では未反映です。`);
      return;
    }

    if (childA.id === childB.id) {
      warnings.push(`個別事情 ${index + 1} は同じ児童が2回選ばれているため、班編成では未反映です。`);
      return;
    }

    const pairKey = [childA.id, childB.id].sort().join("|");
    const existing = appliedPairRuleTypeByKey.get(pairKey);

    if (existing && existing.type !== rule.type) {
      warnings.push(
        `個別事情 ${index + 1} は個別事情 ${existing.index + 1} と競合するため、優先順位により未反映です。`,
      );
      return;
    }

    if (!existing) {
      appliedPairRuleTypeByKey.set(pairKey, { type: rule.type, index });
    }

    if (rule.type === "together") {
      addToSetMap(togetherMap, childA.id, childB.id);
      addToSetMap(togetherMap, childB.id, childA.id);
      return;
    }

    addToSetMap(separateMap, childA.id, childB.id);
    addToSetMap(separateMap, childB.id, childA.id);
  });

  return { togetherMap, separateMap, warnings };
}

function buildTogetherComponents(
  children: ChildRecord[],
  togetherMap: Map<string, Set<string>>,
): GroupComponent[] {
  const childrenById = new Map(children.map((child) => [child.id, child]));
  const visited = new Set<string>();
  const components: GroupComponent[] = [];

  children.forEach((child) => {
    if (visited.has(child.id)) {
      return;
    }

    const stack = [child.id];
    const members: ChildRecord[] = [];
    visited.add(child.id);

    while (stack.length > 0) {
      const currentId = stack.pop();

      if (!currentId) {
        continue;
      }

      const currentChild = childrenById.get(currentId);

      if (currentChild) {
        members.push(currentChild);
      }

      const neighbors = togetherMap.get(currentId);

      neighbors?.forEach((neighborId) => {
        if (visited.has(neighborId)) {
          return;
        }

        visited.add(neighborId);
        stack.push(neighborId);
      });
    }

    components.push({
      members: members.sort(compareChildrenBySeniority),
    });
  });

  return components;
}

function calculateGroupCount(childCount: number, minPerGroup: number, maxPerGroup: number): number | null {
  if (childCount === 0) {
    return null;
  }

  const minimumGroups = Math.ceil(childCount / maxPerGroup);
  const maximumGroups = Math.floor(childCount / minPerGroup);

  if (minimumGroups <= maximumGroups) {
    return minimumGroups;
  }

  return null;
}

function createTargetSizes(childCount: number, groupCount: number, minPerGroup: number): number[] {
  if (groupCount === 1 && childCount < minPerGroup) {
    return [childCount];
  }

  const base = Math.floor(childCount / groupCount);
  const extra = childCount % groupCount;

  return Array.from({ length: groupCount }, (_, index) => base + (index < extra ? 1 : 0));
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function canPlaceInGroup(
  group: InternalGroup,
  component: GroupComponent,
  separateMap: Map<string, Set<string>>,
  maxPerGroup: number,
): boolean {
  const currentMembers = getGroupMembers(group);

  if (currentMembers.length + component.members.length > maxPerGroup) {
    return false;
  }

  for (const child of component.members) {
    const blockedIds = separateMap.get(child.id);

    if (!blockedIds) {
      continue;
    }

    for (const member of currentMembers) {
      if (blockedIds.has(member.id)) {
        return false;
      }
    }
  }

  return true;
}

function backtrackAssign(
  groups: InternalGroup[],
  components: GroupComponent[],
  separateMap: Map<string, Set<string>>,
  maxPerGroup: number,
  counter: { count: number; limit: number },
): boolean {
  if (components.length === 0) {
    return true;
  }

  if (counter.count >= counter.limit) {
    return false;
  }

  counter.count += 1;

  let minValid = groups.length + 1;
  let bestIndex = 0;

  for (let i = 0; i < components.length; i += 1) {
    let validCount = 0;

    for (const group of groups) {
      if (canPlaceInGroup(group, components[i], separateMap, maxPerGroup)) {
        validCount += 1;
      }
    }

    if (validCount < minValid) {
      minValid = validCount;
      bestIndex = i;
    }
  }

  if (minValid === 0) {
    return false;
  }

  const component = components[bestIndex];
  const remaining = [...components.slice(0, bestIndex), ...components.slice(bestIndex + 1)];
  const shuffledGroups = shuffleArray(groups);

  for (const group of shuffledGroups) {
    if (!canPlaceInGroup(group, component, separateMap, maxPerGroup)) {
      continue;
    }

    group.middle.push(...component.members);

    if (backtrackAssign(groups, remaining, separateMap, maxPerGroup, counter)) {
      return true;
    }

    group.middle.splice(group.middle.length - component.members.length, component.members.length);
  }

  return false;
}

function detectSeparateViolations(
  groups: InternalGroup[],
  separateMap: Map<string, Set<string>>,
): string[] {
  const violations: string[] = [];

  for (const group of groups) {
    const members = getGroupMembers(group);

    for (const member of members) {
      const blockedIds = separateMap.get(member.id);

      if (!blockedIds) {
        continue;
      }

      for (const other of members) {
        if (member.id < other.id && blockedIds.has(other.id)) {
          violations.push(
            `${displayChildName(member)} と ${displayChildName(other)} は「別の班」指定ですが、同じ班になっています。`,
          );
        }
      }
    }
  }

  return violations;
}

function chooseBestGroup(
  groups: InternalGroup[],
  component: GroupComponent,
  separateMap: Map<string, Set<string>>,
  maxPerGroup: number,
) {
  return [...groups]
    .map((group) => {
      const currentMembers = getGroupMembers(group);
      const conflictCount = component.members.reduce((count, child) => {
        const blockedIds = separateMap.get(child.id);

        if (!blockedIds) {
          return count;
        }

        const conflicts = currentMembers.filter((member) => blockedIds.has(member.id)).length;
        return count + conflicts;
      }, 0);

      const finalSize = currentMembers.length + component.members.length;
      const overflowBeyondMax = Math.max(0, finalSize - maxPerGroup);
      const overflowBeyondTarget = Math.max(0, finalSize - group.targetSize);
      const shortage = group.targetSize - currentMembers.length;

      return {
        group,
        conflictCount,
        finalSize,
        overflowBeyondMax,
        overflowBeyondTarget,
        shortage,
      };
    })
    .sort((a, b) => {
      if (a.conflictCount !== b.conflictCount) {
        return a.conflictCount - b.conflictCount;
      }

      if (a.overflowBeyondMax !== b.overflowBeyondMax) {
        return a.overflowBeyondMax - b.overflowBeyondMax;
      }

      if (a.overflowBeyondTarget !== b.overflowBeyondTarget) {
        return a.overflowBeyondTarget - b.overflowBeyondTarget;
      }

      if (a.shortage !== b.shortage) {
        return b.shortage - a.shortage;
      }

      if (a.finalSize !== b.finalSize) {
        return a.finalSize - b.finalSize;
      }

      return a.group.index - b.group.index;
    })[0];
}

export function generateSchoolGroups(households: Household[], rules: PairRule[], groupRules: GroupRule[] = []): GroupPlan {
  const warnings: string[] = [];
  const children = getAllChildRecords(households).sort(compareChildrenBySeniority);

  if (children.length === 0) {
    return {
      groups: [],
      warnings: ["児童情報が未入力のため、登校班を生成できません。"],
    };
  }

  let minPerGroup = 4;
  let maxPerGroup = 5;
  let assignLeaders = true;
  let assignRears = true;
  const appliedGroupRuleByType = new Map<GroupRule["type"], number>();

  groupRules.forEach((rule, index) => {
    const existingIndex = appliedGroupRuleByType.get(rule.type);

    if (existingIndex !== undefined) {
      warnings.push(
        `班編成の基本ルール ${index + 1} は同種ルール ${existingIndex + 1} より優先順位が低いため、未反映です。`,
      );
      return;
    }

    appliedGroupRuleByType.set(rule.type, index);

    if (rule.type === "groupSize") {
      minPerGroup = Math.min(rule.minSize, rule.maxSize);
      maxPerGroup = Math.max(rule.minSize, rule.maxSize);
    } else if (rule.type === "leaderPosition") {
      assignLeaders = rule.strategy !== "none";
    } else if (rule.type === "rearPosition") {
      assignRears = rule.strategy !== "none";
    }
  });

  const calculatedGroupCount = calculateGroupCount(children.length, minPerGroup, maxPerGroup);
  const groupCount = calculatedGroupCount ?? 1;

  if (!calculatedGroupCount) {
    warnings.push(
      `児童数が ${children.length} 人のため、全班を${minPerGroup}〜${maxPerGroup}人にそろえることはできません。暫定的な人数で班分けしています。`,
    );
  }

  const targetSizes = createTargetSizes(children.length, groupCount, minPerGroup);
  const groups: InternalGroup[] = Array.from({ length: groupCount }, (_, index) => ({
    index,
    targetSize: targetSizes[index],
    middle: [],
  }));

  const anchorGroupByChildId = new Map<string, number>();
  let anchorOffset = 0;

  if (assignLeaders) {
    groups.forEach((group, index) => {
      const leader = children[index];

      if (leader) {
        group.leader = leader;
        anchorGroupByChildId.set(leader.id, group.index);
      }
    });
    anchorOffset = groupCount;
  }

  if (assignRears) {
    groups.forEach((group, index) => {
      const rear = children[anchorOffset + index];

      if (rear) {
        group.rear = rear;
        anchorGroupByChildId.set(rear.id, group.index);
      }
    });
  }

  const { togetherMap, separateMap, warnings: ruleWarnings } = buildRuleMaps(children, rules);
  warnings.push(...ruleWarnings);

  const components = buildTogetherComponents(children, togetherMap);
  const pendingComponents: GroupComponent[] = [];

  components.forEach((component) => {
    const anchoredGroups = [
      ...new Set(
        component.members
          .map((member) => anchorGroupByChildId.get(member.id))
          .filter((groupIndex): groupIndex is number => groupIndex !== undefined),
      ),
    ];

    component.members.forEach((member) => {
      const separateTargets = separateMap.get(member.id);

      if (!separateTargets) {
        return;
      }

      component.members.forEach((otherMember) => {
        if (member.id !== otherMember.id && separateTargets.has(otherMember.id)) {
          warnings.push(
            `${displayChildName(member)} と ${displayChildName(otherMember)} は「別の班」かつ「同じ班」の指定が重なっているため、個別事情が競合しています。`,
          );
        }
      });
    });

    if (anchoredGroups.length === 0) {
      pendingComponents.push(component);
      return;
    }

    const primaryGroup = anchoredGroups[0];

    if (anchoredGroups.length > 1) {
      warnings.push(
        `${component.members.map(displayChildName).join("、")} は同じ班指定ですが、最年長配置の条件により別班に固定されました。`,
      );
    }

    component.members.forEach((member) => {
      if (anchorGroupByChildId.has(member.id)) {
        return;
      }

      const targetGroup = groups[primaryGroup];

      if (!targetGroup.middle.some((existing) => existing.id === member.id)) {
        targetGroup.middle.push(member);
      }
    });
  });

  const savedMiddles = groups.map((group) => [...group.middle]);
  const shuffledPending = shuffleArray(pendingComponents);
  const counter = { count: 0, limit: 100_000 };
  const backtrackSuccess = backtrackAssign(groups, shuffledPending, separateMap, maxPerGroup, counter);

  if (!backtrackSuccess) {
    groups.forEach((group, i) => {
      group.middle = savedMiddles[i];
    });

    pendingComponents
      .sort((a, b) => compareChildrenBySeniority(a.members[0], b.members[0]))
      .forEach((component) => {
        const candidate = chooseBestGroup(groups, component, separateMap, maxPerGroup);

        if (candidate.overflowBeyondMax > 0) {
          warnings.push(
            `第${candidate.group.index + 1}班は条件を優先したため ${candidate.finalSize} 人になり、${maxPerGroup}人を超えています。`,
          );
        }

        candidate.group.middle.push(...component.members);
      });

    const violations = detectSeparateViolations(groups, separateMap);
    warnings.push(...violations);
  }

  const generatedGroups: GeneratedGroup[] = groups.map((group) => {
    const middleMembers = [...group.middle].sort(compareChildrenBySeniority);
    const members = [
      ...(group.leader ? [group.leader] : []),
      ...middleMembers.filter(
        (member) => member.id !== group.leader?.id && member.id !== group.rear?.id,
      ),
      ...(group.rear ? [group.rear] : []),
    ];

    if (members.length < minPerGroup || members.length > maxPerGroup) {
      warnings.push(`第${group.index + 1}班は ${members.length} 人です。${minPerGroup}〜${maxPerGroup}人の範囲を外れています。`);
    }

    return {
      name: `第${group.index + 1}班`,
      targetSize: group.targetSize,
      members,
      leaderId: group.leader?.id,
      rearId: group.rear?.id,
    };
  });

  return {
    groups: generatedGroups,
    warnings: [...new Set(warnings)],
  };
}

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result;
}

function isSameWeek(left: Date, right: Date): boolean {
  return startOfWeek(left).getTime() === startOfWeek(right).getTime();
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function generateFlagDutySchedule(
  households: Household[],
  schoolEvents: SchoolEvent[],
  settings: FlagDutySettings,
): FlagDutyPlan {
  const warnings: string[] = [];
  const activeHouseholds = households.filter((household) => household.children.length > 0);

  if (activeHouseholds.length === 0) {
    return {
      slots: [],
      warnings: ["家庭情報が未入力のため、旗当番表を生成できません。"],
    };
  }

  if (!settings.startDate) {
    return {
      slots: [],
      warnings: ["旗当番表を生成するには、開始日を入力してください。"],
    };
  }

  if (!settings.endDate) {
    return {
      slots: [],
      warnings: ["旗当番表を生成するには、終了日を入力してください。"],
    };
  }

  const startDate = parseDateLocal(settings.startDate);

  if (Number.isNaN(startDate.getTime())) {
    return {
      slots: [],
      warnings: ["旗当番表の開始日が不正です。"],
    };
  }

  const endDate = parseDateLocal(settings.endDate);

  if (Number.isNaN(endDate.getTime())) {
    return {
      slots: [],
      warnings: ["旗当番表の終了日が不正です。"],
    };
  }

  if (endDate.getTime() < startDate.getTime()) {
    return {
      slots: [],
      warnings: ["終了日は開始日以降の日付を指定してください。"],
    };
  }

  const assignmentCounts = new Map(activeHouseholds.map((household) => [household.id, 0]));
  const dutyLimitMap = new Map(
    (settings.dutyLimits ?? [])
      .filter((limit) => limit.householdId && limit.maxCount >= 0)
      .map((limit) => [limit.householdId, limit.maxCount]),
  );
  const slots: FlagDutySlot[] = [];
  let previousHouseholdId = "";

  for (let weekIndex = 0; ; weekIndex += 1) {
    const slotDate = addDays(startDate, weekIndex * 7);

    if (slotDate.getTime() > endDate.getTime()) {
      break;
    }

    const rankedHouseholds = activeHouseholds
      .map((household) => {
        const householdGrades = new Set(household.children.map((child) => child.grade));
        const blockedEvents = schoolEvents
          .filter((eventItem) => {
            if (!eventItem.date || eventItem.targetGrades.length === 0) {
              return false;
            }

            const eventDate = parseDateLocal(eventItem.date);

            if (Number.isNaN(eventDate.getTime()) || !isSameWeek(slotDate, eventDate)) {
              return false;
            }

            return eventItem.targetGrades.some((grade) => householdGrades.has(grade));
          })
          .map((eventItem) => eventItem.title || `${eventItem.date} の学校行事`);

        const currentTotal = household.pastDutyCount + (assignmentCounts.get(household.id) ?? 0);
        const maxCount = dutyLimitMap.get(household.id);
        const reachedLimit = maxCount !== undefined && currentTotal >= maxCount;

        return {
          household,
          blockedEvents,
          totalDutyCount: currentTotal,
          reachedLimit,
          consecutivePenalty: previousHouseholdId === household.id && activeHouseholds.length > 1 ? 1 : 0,
        };
      })
      .sort((a, b) => {
        if (a.blockedEvents.length === 0 && b.blockedEvents.length > 0) {
          return -1;
        }

        if (a.blockedEvents.length > 0 && b.blockedEvents.length === 0) {
          return 1;
        }

        if (a.reachedLimit !== b.reachedLimit) {
          return a.reachedLimit ? 1 : -1;
        }

        if (a.totalDutyCount !== b.totalDutyCount) {
          return a.totalDutyCount - b.totalDutyCount;
        }

        if (a.consecutivePenalty !== b.consecutivePenalty) {
          return a.consecutivePenalty - b.consecutivePenalty;
        }

        const nameCompare = a.household.householdName.localeCompare(b.household.householdName, "ja");

        if (nameCompare !== 0) {
          return nameCompare;
        }

        return a.household.addressOrRoom.localeCompare(b.household.addressOrRoom, "ja");
      });

    const selected = rankedHouseholds.find(
      (candidate) => candidate.blockedEvents.length === 0 && !candidate.reachedLimit,
    );

    if (!selected) {
      const allBlocked = rankedHouseholds.every((c) => c.blockedEvents.length > 0);
      const allLimited = rankedHouseholds.every((c) => c.reachedLimit);
      let reason = "担当可能な家庭が見つかりませんでした。";

      if (allBlocked) {
        reason = "学校行事の影響で担当可能な家庭が見つかりませんでした。";
      } else if (allLimited) {
        reason = "すべての家庭が最大担当回数に達しているため、担当可能な家庭が見つかりませんでした。";
      } else {
        reason = "学校行事や最大担当回数の制限により、担当可能な家庭が見つかりませんでした。";
      }

      warnings.push(`${formatDateLabel(slotDate)} の週は${reason}`);
      slots.push({
        id: `slot-${weekIndex + 1}`,
        dateLabel: formatDateLabel(slotDate),
        addressOrRoom: "",
        householdName: "未割当",
        blockedEvents: rankedHouseholds.flatMap((candidate) => candidate.blockedEvents),
        totalDutyCount: null,
      });
      continue;
    }

    assignmentCounts.set(selected.household.id, (assignmentCounts.get(selected.household.id) ?? 0) + 1);
    previousHouseholdId = selected.household.id;

    slots.push({
      id: `slot-${weekIndex + 1}`,
      dateLabel: formatDateLabel(slotDate),
      addressOrRoom: selected.household.addressOrRoom,
      householdName: selected.household.householdName,
      householdId: selected.household.id,
      blockedEvents: selected.blockedEvents,
      totalDutyCount: selected.household.pastDutyCount + (assignmentCounts.get(selected.household.id) ?? 0),
    });
  }

  return {
    slots,
    warnings: [...new Set(warnings)],
  };
}