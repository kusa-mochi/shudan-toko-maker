import type {
  FlagDutySettings,
  GroupRule,
  Household,
  PairRule,
  SchoolEvent,
} from "./plannerTypes";

export type DemoPlannerState = {
  households: Household[];
  pairRules: PairRule[];
  groupRules: GroupRule[];
  schoolEvents: SchoolEvent[];
  flagDutySettings: FlagDutySettings;
  nextIds: {
    household: number;
    child: number;
    pairRule: number;
    groupRule: number;
    schoolEvent: number;
  };
};

// 初期状態: 空のご家庭カード1枚だけ表示し、ユーザーが入力を始められるようにする
export function createDemoPlannerState(): DemoPlannerState {
  return {
    households: [
      {
        id: "household-1",
        householdName: "",
        memo: "",
        pastDutyCount: 0,
        children: [{ id: "child-1", name: "", grade: 1 }],
      },
    ],
    pairRules: [],
    groupRules: [
      {
        id: "group-rule-1",
        type: "groupSize",
        minSize: 4,
        maxSize: 5,
        strategy: "most-senior",
        note: "",
      },
      {
        id: "group-rule-2",
        type: "leaderPosition",
        minSize: 4,
        maxSize: 5,
        strategy: "most-senior",
        note: "",
      },
      {
        id: "group-rule-3",
        type: "rearPosition",
        minSize: 4,
        maxSize: 5,
        strategy: "most-senior",
        note: "",
      },
    ],
    schoolEvents: [],
    flagDutySettings: {
      startDate: "",
      endDate: "",
      dutyLimits: [],
    },
    nextIds: {
      household: 2,
      child: 2,
      pairRule: 1,
      groupRule: 4,
      schoolEvent: 1,
    },
  };
}