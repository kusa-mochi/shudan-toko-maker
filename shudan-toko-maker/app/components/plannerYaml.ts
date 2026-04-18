import type {
  FlagDutySettings,
  Grade,
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

type ExportEnvelope = {
  schema: "shudan-toko-maker/input-data.v1";
  exportedAt: string;
  data: PlannerInputData;
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
      householdName: readString(item.householdName ?? "", `households[${householdIndex}].householdName`),
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

function readFlagDutySettings(value: unknown): FlagDutySettings {
  if (!isRecord(value)) {
    throw new Error("flagDutySettings の形式が不正です。");
  }

  return {
    startDate: readString(value.startDate ?? "", "flagDutySettings.startDate"),
    weeks: readInteger(value.weeks, "flagDutySettings.weeks", 1),
  };
}

function readPlannerInputData(value: unknown): PlannerInputData {
  if (!isRecord(value)) {
    throw new Error("YAML のルート形式が不正です。");
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

export function serializePlannerInputToYaml(data: PlannerInputData): string {
  const payload: ExportEnvelope = {
    schema: "shudan-toko-maker/input-data.v1",
    exportedAt: new Date().toISOString(),
    data,
  };

  // JSON is a valid subset of YAML. Output as pretty JSON text with .yml extension.
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parsePlannerInputFromYaml(yamlText: string): PlannerInputData {
  const normalizedText = yamlText.trim();

  if (!normalizedText) {
    throw new Error("YAMLが空です。テンプレートファイルを元に入力してください。");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(normalizedText);
  } catch {
    throw new Error(
      "この環境では JSON互換YAML 形式のみ読込できます。テンプレート取得したファイルを編集して読み込んでください。",
    );
  }

  if (isRecord(parsed) && isRecord(parsed.data)) {
    return readPlannerInputData(parsed.data);
  }

  return readPlannerInputData(parsed);
}
