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

export type PlannerInputData = {
  households: Household[];
  pairRules: PairRule[];
  groupRules: GroupRule[];
  rulePriorityOrder: string[];
  schoolEvents: SchoolEvent[];
  flagDutySettings: FlagDutySettings;
};

export type PlannerResultsData = {
  groupPlan: GroupPlan;
  flagDutyPlan: FlagDutyPlan;
};

export type PlannerSnapshotData = {
  input: PlannerInputData;
  results: PlannerResultsData;
};

type ExportEnvelope = {
  schema: "shudan-toko-maker/snapshot.v2";
  exportedAt: string;
  data: PlannerSnapshotData;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} は文字列である必要があります。`);
  }

  return value;
}

function readInteger(value: unknown, fieldName: string, minValue = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${fieldName} は整数である必要があります。`);
  }

  if (value < minValue) {
    throw new Error(`${fieldName} は ${minValue} 以上である必要があります。`);
  }

  return value;
}

function readOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return readString(value, fieldName);
}

function readNullableInteger(value: unknown, fieldName: string, minValue = 0): number | null {
  if (value === null) {
    return null;
  }

  return readInteger(value, fieldName, minValue);
}

function readStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} は配列である必要があります。`);
  }

  return value.map((item, index) => readString(item, `${fieldName}[${index}]`));
}

function readGrade(value: unknown, fieldName: string): Grade {
  const grade = readInteger(value, fieldName, 1);

  if (grade < 1 || grade > 6) {
    throw new Error(`${fieldName} は 1〜6 年の範囲で指定してください。`);
  }

  return grade as Grade;
}

function readRulePriorityOrder(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .filter((ruleKey) => ruleKey.startsWith("group:") || ruleKey.startsWith("pair:"));
}

function splitLegacyHouseholdName(combined: string): { addressOrRoom: string; householdName: string } {
  const trimmed = combined.trim();

  if (!trimmed) {
    return { addressOrRoom: "", householdName: "" };
  }

  const matched = trimmed.match(/^(\S+(?:号室|番地))\s+(.+)$/);

  if (matched) {
    return {
      addressOrRoom: matched[1],
      householdName: matched[2],
    };
  }

  return {
    addressOrRoom: "",
    householdName: trimmed,
  };
}

function readHouseholds(value: unknown): Household[] {
  if (!Array.isArray(value)) {
    throw new Error("households は配列である必要があります。");
  }

  if (value.length === 0) {
    throw new Error("households は1件以上必要です。");
  }

  return value.map((item, householdIndex) => {
    if (!isRecord(item)) {
      throw new Error(`households[${householdIndex}] の形式が不正です。`);
    }

    const childrenSource = item.children;

    if (!Array.isArray(childrenSource) || childrenSource.length === 0) {
      throw new Error(`households[${householdIndex}].children は1件以上必要です。`);
    }

    const children = childrenSource.map((childItem, childIndex) => {
      if (!isRecord(childItem)) {
        throw new Error(`households[${householdIndex}].children[${childIndex}] の形式が不正です。`);
      }

      return {
        id: readString(childItem.id, `households[${householdIndex}].children[${childIndex}].id`),
        name: readString(childItem.name ?? "", `households[${householdIndex}].children[${childIndex}].name`),
        grade: readGrade(childItem.grade, `households[${householdIndex}].children[${childIndex}].grade`),
      };
    });

    return {
      id: readString(item.id, `households[${householdIndex}].id`),
      ...(() => {
        const explicitAddress = readString(
          item.addressOrRoom ?? "",
          `households[${householdIndex}].addressOrRoom`,
        );
        const explicitHouseholdName = readString(
          item.householdName ?? "",
          `households[${householdIndex}].householdName`,
        );

        if (explicitAddress || !explicitHouseholdName) {
          return {
            addressOrRoom: explicitAddress,
            householdName: explicitHouseholdName,
          };
        }

        return splitLegacyHouseholdName(explicitHouseholdName);
      })(),
      memo: readString(item.memo ?? "", `households[${householdIndex}].memo`),
      pastDutyCount: readInteger(item.pastDutyCount ?? 0, `households[${householdIndex}].pastDutyCount`, 0),
      children,
    };
  });
}

function readPairRules(value: unknown): PairRule[] {
  if (!Array.isArray(value)) {
    throw new Error("pairRules は配列である必要があります。");
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`pairRules[${index}] の形式が不正です。`);
    }

    const type = readString(item.type, `pairRules[${index}].type`);

    if (type !== "separate" && type !== "together") {
      throw new Error(`pairRules[${index}].type は separate または together を指定してください。`);
    }

    return {
      id: readString(item.id, `pairRules[${index}].id`),
      type,
      childAId: readString(item.childAId ?? "", `pairRules[${index}].childAId`),
      childBId: readString(item.childBId ?? "", `pairRules[${index}].childBId`),
      note: readString(item.note ?? "", `pairRules[${index}].note`),
    };
  });
}

function readGroupRules(value: unknown): GroupRule[] {
  if (!Array.isArray(value)) {
    throw new Error("groupRules は配列である必要があります。");
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`groupRules[${index}] の形式が不正です。`);
    }

    const type = readString(item.type, `groupRules[${index}].type`);

    if (type !== "groupSize" && type !== "leaderPosition" && type !== "rearPosition") {
      throw new Error(
        `groupRules[${index}].type は groupSize / leaderPosition / rearPosition を指定してください。`,
      );
    }

    const strategy = readString(item.strategy, `groupRules[${index}].strategy`);

    if (strategy !== "most-senior" && strategy !== "none") {
      throw new Error(`groupRules[${index}].strategy は most-senior または none を指定してください。`);
    }

    return {
      id: readString(item.id, `groupRules[${index}].id`),
      type,
      minSize: readInteger(item.minSize, `groupRules[${index}].minSize`, 1),
      maxSize: readInteger(item.maxSize, `groupRules[${index}].maxSize`, 1),
      strategy,
      note: readString(item.note ?? "", `groupRules[${index}].note`),
    };
  });
}

function readSchoolEvents(value: unknown): SchoolEvent[] {
  if (!Array.isArray(value)) {
    throw new Error("schoolEvents は配列である必要があります。");
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`schoolEvents[${index}] の形式が不正です。`);
    }

    const targetGradesSource = item.targetGrades;

    if (!Array.isArray(targetGradesSource)) {
      throw new Error(`schoolEvents[${index}].targetGrades は配列である必要があります。`);
    }

    const targetGrades = Array.from(
      new Set(
        targetGradesSource.map((grade, gradeIndex) =>
          readGrade(grade, `schoolEvents[${index}].targetGrades[${gradeIndex}]`),
        ),
      ),
    ).sort((left, right) => left - right) as Grade[];

    return {
      id: readString(item.id, `schoolEvents[${index}].id`),
      title: readString(item.title ?? "", `schoolEvents[${index}].title`),
      date: readString(item.date ?? "", `schoolEvents[${index}].date`),
      targetGrades,
    };
  });
}

function readDutyLimits(value: unknown): { householdId: string; maxCount: number }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      householdId: readString(item.householdId ?? "", "dutyLimits[].householdId"),
      maxCount: readInteger(item.maxCount ?? 0, "dutyLimits[].maxCount", 0),
    }))
    .filter((item) => item.householdId !== "");
}

function readFlagDutySettings(value: unknown): FlagDutySettings {
  if (!isRecord(value)) {
    throw new Error("flagDutySettings の形式が不正です。");
  }

  return {
    startDate: readString(value.startDate ?? "", "flagDutySettings.startDate"),
    endDate: readString(value.endDate ?? "", "flagDutySettings.endDate"),
    dutyLimits: readDutyLimits(value.dutyLimits),
  };
}

function readPlannerInputData(value: unknown): PlannerInputData {
  if (!isRecord(value)) {
    throw new Error("JSON のルート形式が不正です。");
  }

  return {
    households: readHouseholds(value.households),
    pairRules: readPairRules(value.pairRules),
    groupRules: readGroupRules(value.groupRules),
    rulePriorityOrder: readRulePriorityOrder(value.rulePriorityOrder),
    schoolEvents: readSchoolEvents(value.schoolEvents),
    flagDutySettings: readFlagDutySettings(value.flagDutySettings),
  };
}

function readGroupPlan(value: unknown): GroupPlan {
  if (!isRecord(value)) {
    throw new Error("results.groupPlan の形式が不正です。");
  }

  if (!Array.isArray(value.groups)) {
    throw new Error("results.groupPlan.groups は配列である必要があります。");
  }

  const groups = value.groups.map((group, groupIndex) => {
    if (!isRecord(group)) {
      throw new Error(`results.groupPlan.groups[${groupIndex}] の形式が不正です。`);
    }

    if (!Array.isArray(group.members)) {
      throw new Error(`results.groupPlan.groups[${groupIndex}].members は配列である必要があります。`);
    }

    const members = group.members.map((member, memberIndex) => {
      if (!isRecord(member)) {
        throw new Error(
          `results.groupPlan.groups[${groupIndex}].members[${memberIndex}] の形式が不正です。`,
        );
      }

      return {
        id: readString(
          member.id,
          `results.groupPlan.groups[${groupIndex}].members[${memberIndex}].id`,
        ),
        name: readString(
          member.name ?? "",
          `results.groupPlan.groups[${groupIndex}].members[${memberIndex}].name`,
        ),
        grade: readGrade(
          member.grade,
          `results.groupPlan.groups[${groupIndex}].members[${memberIndex}].grade`,
        ),
        householdId: readString(
          member.householdId,
          `results.groupPlan.groups[${groupIndex}].members[${memberIndex}].householdId`,
        ),
        addressOrRoom: readString(
          member.addressOrRoom ?? "",
          `results.groupPlan.groups[${groupIndex}].members[${memberIndex}].addressOrRoom`,
        ),
        householdName: readString(
          member.householdName ?? "",
          `results.groupPlan.groups[${groupIndex}].members[${memberIndex}].householdName`,
        ),
      };
    });

    return {
      name: readString(group.name, `results.groupPlan.groups[${groupIndex}].name`),
      targetSize: readInteger(group.targetSize, `results.groupPlan.groups[${groupIndex}].targetSize`, 1),
      members,
      leaderId: readOptionalString(group.leaderId, `results.groupPlan.groups[${groupIndex}].leaderId`),
      rearId: readOptionalString(group.rearId, `results.groupPlan.groups[${groupIndex}].rearId`),
    };
  });

  return {
    groups,
    warnings: readStringArray(value.warnings ?? [], "results.groupPlan.warnings"),
  };
}

function readFlagDutyPlan(value: unknown): FlagDutyPlan {
  if (!isRecord(value)) {
    throw new Error("results.flagDutyPlan の形式が不正です。");
  }

  if (!Array.isArray(value.slots)) {
    throw new Error("results.flagDutyPlan.slots は配列である必要があります。");
  }

  const slots = value.slots.map((slot, slotIndex) => {
    if (!isRecord(slot)) {
      throw new Error(`results.flagDutyPlan.slots[${slotIndex}] の形式が不正です。`);
    }

    return {
      id: readString(slot.id, `results.flagDutyPlan.slots[${slotIndex}].id`),
      dateLabel: readString(slot.dateLabel, `results.flagDutyPlan.slots[${slotIndex}].dateLabel`),
      addressOrRoom: readString(
        slot.addressOrRoom ?? "",
        `results.flagDutyPlan.slots[${slotIndex}].addressOrRoom`,
      ),
      householdName: readString(
        slot.householdName ?? "",
        `results.flagDutyPlan.slots[${slotIndex}].householdName`,
      ),
      householdId: readOptionalString(slot.householdId, `results.flagDutyPlan.slots[${slotIndex}].householdId`),
      blockedEvents: readStringArray(
        slot.blockedEvents ?? [],
        `results.flagDutyPlan.slots[${slotIndex}].blockedEvents`,
      ),
      totalDutyCount: readNullableInteger(
        slot.totalDutyCount ?? null,
        `results.flagDutyPlan.slots[${slotIndex}].totalDutyCount`,
        0,
      ),
    };
  });

  return {
    slots,
    warnings: readStringArray(value.warnings ?? [], "results.flagDutyPlan.warnings"),
  };
}

function readPlannerSnapshotData(value: unknown): PlannerSnapshotData {
  if (!isRecord(value)) {
    throw new Error("JSON の data 形式が不正です。");
  }

  return {
    input: readPlannerInputData(value.input),
    results: {
      groupPlan: readGroupPlan(value.results && isRecord(value.results) ? value.results.groupPlan : undefined),
      flagDutyPlan: readFlagDutyPlan(
        value.results && isRecord(value.results) ? value.results.flagDutyPlan : undefined,
      ),
    },
  };
}

export function serializePlannerSnapshotToJson(data: PlannerSnapshotData): string {
  const payload: ExportEnvelope = {
    schema: "shudan-toko-maker/snapshot.v2",
    exportedAt: new Date().toISOString(),
    data,
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parsePlannerSnapshotFromJson(jsonText: string): PlannerSnapshotData {
  const normalizedText = jsonText.trim();

  if (!normalizedText) {
    throw new Error("JSONが空です。保存済みファイルを選択してください。");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(normalizedText);
  } catch {
    throw new Error("JSON形式が不正です。保存したJSONファイルを選択してください。");
  }

  if (!isRecord(parsed)) {
    throw new Error("JSON のルート形式が不正です。");
  }

  if (parsed.schema !== "shudan-toko-maker/snapshot.v2") {
    throw new Error("このJSONは未対応の形式です。最新版で保存したJSONを利用してください。");
  }

  return readPlannerSnapshotData(parsed.data);
}
