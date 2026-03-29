export type Grade = 1 | 2 | 3 | 4 | 5 | 6;
export type PairRuleType = "separate" | "together";

export type Child = {
  id: string;
  name: string;
  grade: Grade;
};

export type Household = {
  id: string;
  householdName: string;
  memo: string;
  pastDutyCount: number;
  children: Child[];
};

export type PairRule = {
  id: string;
  type: PairRuleType;
  childAId: string;
  childBId: string;
  note: string;
};

export type GroupRuleType = "groupSize" | "leaderPosition" | "rearPosition";
export type PositionStrategy = "most-senior" | "none";

export type GroupRule = {
  id: string;
  type: GroupRuleType;
  minSize: number;
  maxSize: number;
  strategy: PositionStrategy;
  note: string;
};

export type SchoolEvent = {
  id: string;
  title: string;
  date: string;
  targetGrades: Grade[];
};

export type FlagDutySettings = {
  startDate: string;
  weeks: number;
};

export type ChildRecord = {
  id: string;
  name: string;
  grade: Grade;
  householdId: string;
  householdName: string;
};

export type GeneratedGroup = {
  name: string;
  targetSize: number;
  members: ChildRecord[];
  leaderId?: string;
  rearId?: string;
};

export type GroupPlan = {
  groups: GeneratedGroup[];
  warnings: string[];
};

export type FlagDutySlot = {
  id: string;
  dateLabel: string;
  householdName: string;
  householdId?: string;
  blockedEvents: string[];
  totalDutyCount: number | null;
};

export type FlagDutyPlan = {
  slots: FlagDutySlot[];
  warnings: string[];
};

export const gradeOptions: Array<{ value: Grade; label: string }> = [
  { value: 1, label: "1年" },
  { value: 2, label: "2年" },
  { value: 3, label: "3年" },
  { value: 4, label: "4年" },
  { value: 5, label: "5年" },
  { value: 6, label: "6年" },
];