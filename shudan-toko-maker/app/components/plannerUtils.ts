import type {
  Child,
  ChildRecord,
  FlagDutyPlan,
  FlagDutySettings,
  GeneratedGroup,
  Grade,
  GroupPlan,
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
    householdName: "",
    memo: "",
    pastDutyCount: 0,
    children: [createChild(childId)],
  };
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

function calculateGroupCount(childCount: number): number | null {
  if (childCount === 0) {
    return null;
  }

  const minimumGroups = Math.ceil(childCount / 5);
  const maximumGroups = Math.floor(childCount / 4);

  if (minimumGroups <= maximumGroups) {
    return minimumGroups;
  }

  return null;
}

function createTargetSizes(childCount: number, groupCount: number): number[] {
  if (groupCount === 1 && childCount < 4) {
    return [childCount];
  }

  const base = Math.floor(childCount / groupCount);
  const extra = childCount % groupCount;

  return Array.from({ length: groupCount }, (_, index) => base + (index < extra ? 1 : 0));
}

function chooseBestGroup(
  groups: InternalGroup[],
  component: GroupComponent,
  separateMap: Map<string, Set<string>>,
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
      const overflowBeyondFive = Math.max(0, finalSize - 5);
      const overflowBeyondTarget = Math.max(0, finalSize - group.targetSize);
      const shortage = group.targetSize - currentMembers.length;

      return {
        group,
        conflictCount,
        finalSize,
        overflowBeyondFive,
        overflowBeyondTarget,
        shortage,
      };
    })
    .sort((a, b) => {
      if (a.conflictCount !== b.conflictCount) {
        return a.conflictCount - b.conflictCount;
      }

      if (a.overflowBeyondFive !== b.overflowBeyondFive) {
        return a.overflowBeyondFive - b.overflowBeyondFive;
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

export function generateSchoolGroups(households: Household[], rules: PairRule[]): GroupPlan {
  const warnings: string[] = [];
  const children = getAllChildRecords(households).sort(compareChildrenBySeniority);

  if (children.length === 0) {
    return {
      groups: [],
      warnings: ["児童情報が未入力のため、登校班を生成できません。"],
    };
  }

  const calculatedGroupCount = calculateGroupCount(children.length);
  const groupCount = calculatedGroupCount ?? 1;

  if (!calculatedGroupCount) {
    warnings.push(
      `児童数が ${children.length} 人のため、全班を4〜5人にそろえることはできません。暫定的な人数で班分けしています。`,
    );
  }

  const targetSizes = createTargetSizes(children.length, groupCount);
  const groups: InternalGroup[] = Array.from({ length: groupCount }, (_, index) => ({
    index,
    targetSize: targetSizes[index],
    middle: [],
  }));

  const anchorGroupByChildId = new Map<string, number>();

  groups.forEach((group, index) => {
    const leader = children[index];
    const rear = children[groupCount + index];

    if (leader) {
      group.leader = leader;
      anchorGroupByChildId.set(leader.id, group.index);
    }

    if (rear) {
      group.rear = rear;
      anchorGroupByChildId.set(rear.id, group.index);
    }
  });

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

  pendingComponents
    .sort((a, b) => compareChildrenBySeniority(a.members[0], b.members[0]))
    .forEach((component) => {
      const candidate = chooseBestGroup(groups, component, separateMap);

      if (candidate.conflictCount > 0) {
        warnings.push(
          `${component.members.map(displayChildName).join("、")} は個別事情を完全には満たせず、近い条件の班に割り当てました。`,
        );
      }

      if (candidate.overflowBeyondFive > 0) {
        warnings.push(
          `第${candidate.group.index + 1}班は条件を優先したため ${candidate.finalSize} 人になり、5人を超えています。`,
        );
      }

      candidate.group.middle.push(...component.members);
    });

  const generatedGroups: GeneratedGroup[] = groups.map((group) => {
    const middleMembers = [...group.middle].sort(compareChildrenBySeniority);
    const members = [
      ...(group.leader ? [group.leader] : []),
      ...middleMembers.filter(
        (member) => member.id !== group.leader?.id && member.id !== group.rear?.id,
      ),
      ...(group.rear ? [group.rear] : []),
    ];

    if (members.length < 4 || members.length > 5) {
      warnings.push(`第${group.index + 1}班は ${members.length} 人です。4〜5人の範囲を外れています。`);
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

  if (settings.weeks < 1) {
    return {
      slots: [],
      warnings: ["旗当番表を生成するには、週数を1以上に設定してください。"],
    };
  }

  const startDate = new Date(`${settings.startDate}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    return {
      slots: [],
      warnings: ["旗当番表の開始日が不正です。"],
    };
  }

  const assignmentCounts = new Map(activeHouseholds.map((household) => [household.id, 0]));
  const slots = [];
  let previousHouseholdId = "";

  for (let weekIndex = 0; weekIndex < settings.weeks; weekIndex += 1) {
    const slotDate = addDays(startDate, weekIndex * 7);

    const rankedHouseholds = activeHouseholds
      .map((household) => {
        const householdGrades = new Set(household.children.map((child) => child.grade));
        const blockedEvents = schoolEvents
          .filter((eventItem) => {
            if (!eventItem.date || eventItem.targetGrades.length === 0) {
              return false;
            }

            const eventDate = new Date(`${eventItem.date}T00:00:00`);

            if (Number.isNaN(eventDate.getTime()) || !isSameWeek(slotDate, eventDate)) {
              return false;
            }

            return eventItem.targetGrades.some((grade) => householdGrades.has(grade));
          })
          .map((eventItem) => eventItem.title || `${eventItem.date} の学校行事`);

        return {
          household,
          blockedEvents,
          totalDutyCount: household.pastDutyCount + (assignmentCounts.get(household.id) ?? 0),
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

        if (a.totalDutyCount !== b.totalDutyCount) {
          return a.totalDutyCount - b.totalDutyCount;
        }

        if (a.consecutivePenalty !== b.consecutivePenalty) {
          return a.consecutivePenalty - b.consecutivePenalty;
        }

        return a.household.householdName.localeCompare(b.household.householdName, "ja");
      });

    const selected = rankedHouseholds.find((candidate) => candidate.blockedEvents.length === 0);

    if (!selected) {
      warnings.push(`${formatDateLabel(slotDate)} の週は学校行事の影響で担当可能な家庭が見つかりませんでした。`);
      slots.push({
        id: `slot-${weekIndex + 1}`,
        dateLabel: formatDateLabel(slotDate),
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
      householdName: selected.household.householdName || "未入力のご家庭",
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