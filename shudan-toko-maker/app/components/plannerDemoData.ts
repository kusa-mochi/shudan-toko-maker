import type {
  FlagDutySettings,
  Household,
  PairRule,
  SchoolEvent,
} from "./plannerTypes";

export type DemoPlannerState = {
  households: Household[];
  pairRules: PairRule[];
  schoolEvents: SchoolEvent[];
  flagDutySettings: FlagDutySettings;
  nextIds: {
    household: number;
    child: number;
    pairRule: number;
    schoolEvent: number;
  };
};

// TODO: 開発確認用のダミーデータです。本番入力や保存処理を実装する段階で削除してください。
export function createDemoPlannerState(): DemoPlannerState {
  return {
    households: [
      {
        id: "household-1",
        householdName: "203号室 山田さん宅",
        memo: "新1年生あり。兄弟は同じ班を希望。",
        pastDutyCount: 1,
        children: [
          { id: "child-1", name: "山田 さくら", grade: 6 },
          { id: "child-2", name: "山田 ひなた", grade: 2 },
          { id: "child-3", name: "山田 みのり", grade: 1 },
        ],
      },
      {
        id: "household-2",
        householdName: "105号室 佐藤さん宅",
        memo: "朝の集合場所がやや遠い。",
        pastDutyCount: 0,
        children: [
          { id: "child-4", name: "佐藤 はると", grade: 5 },
          { id: "child-5", name: "佐藤 みお", grade: 3 },
        ],
      },
      {
        id: "household-3",
        householdName: "12番地 鈴木さん宅",
        memo: "兄弟はいないが近所の子と同班希望。",
        pastDutyCount: 2,
        children: [
          { id: "child-6", name: "鈴木 れん", grade: 6 },
          { id: "child-7", name: "鈴木 あおい", grade: 1 },
        ],
      },
      {
        id: "household-4",
        householdName: "301号室 高橋さん宅",
        memo: "高学年不在。低学年中心。",
        pastDutyCount: 0,
        children: [
          { id: "child-8", name: "高橋 そうた", grade: 4 },
          { id: "child-9", name: "高橋 ゆい", grade: 2 },
        ],
      },
      {
        id: "household-5",
        householdName: "8番地 伊藤さん宅",
        memo: "修学旅行週は旗当番不可の想定確認用。",
        pastDutyCount: 1,
        children: [
          { id: "child-10", name: "伊藤 りく", grade: 6 },
          { id: "child-11", name: "伊藤 すみれ", grade: 4 },
        ],
      },
      {
        id: "household-6",
        householdName: "402号室 中村さん宅",
        memo: "登校集合は西側ルート。",
        pastDutyCount: 0,
        children: [
          { id: "child-12", name: "中村 ゆうと", grade: 5 },
          { id: "child-13", name: "中村 ここな", grade: 2 },
        ],
      },
      {
        id: "household-7",
        householdName: "15番地 小林さん宅",
        memo: "低学年の付き添い確認用。",
        pastDutyCount: 3,
        children: [
          { id: "child-14", name: "小林 けんた", grade: 4 },
          { id: "child-15", name: "小林 ひかり", grade: 1 },
        ],
      },
      {
        id: "household-8",
        householdName: "201号室 加藤さん宅",
        memo: "兄弟別班の検証候補。",
        pastDutyCount: 1,
        children: [
          { id: "child-16", name: "加藤 りお", grade: 3 },
          { id: "child-17", name: "加藤 なお", grade: 2 },
        ],
      },
      {
        id: "household-9",
        householdName: "7番地 吉田さん宅",
        memo: "一人っ子家庭の確認用。",
        pastDutyCount: 2,
        children: [{ id: "child-18", name: "吉田 はな", grade: 6 }],
      },
      {
        id: "household-10",
        householdName: "504号室 松本さん宅",
        memo: "一人っ子家庭の確認用。",
        pastDutyCount: 0,
        children: [{ id: "child-19", name: "松本 そうすけ", grade: 3 }],
      },
      {
        id: "household-11",
        householdName: "22番地 井上さん宅",
        memo: "一人っ子家庭の確認用。",
        pastDutyCount: 1,
        children: [{ id: "child-20", name: "井上 みく", grade: 5 }],
      },
    ],
    pairRules: [
      {
        id: "pair-rule-1",
        type: "together",
        childAId: "child-3",
        childBId: "child-15",
        note: "新1年生同士なので同じ班にしたい",
      },
      {
        id: "pair-rule-2",
        type: "separate",
        childAId: "child-5",
        childBId: "child-16",
        note: "個別事情により別班にしたい",
      },
      {
        id: "pair-rule-3",
        type: "together",
        childAId: "child-1",
        childBId: "child-2",
        note: "兄弟は同じ班希望",
      },
    ],
    schoolEvents: [
      {
        id: "school-event-1",
        title: "6年生 修学旅行",
        date: "2026-05-19",
        targetGrades: [6],
      },
      {
        id: "school-event-2",
        title: "3年生 社会科見学",
        date: "2026-05-26",
        targetGrades: [3],
      },
      {
        id: "school-event-3",
        title: "1・2年生 遠足",
        date: "2026-06-02",
        targetGrades: [1, 2],
      },
    ],
    flagDutySettings: {
      startDate: "2026-05-12",
      weeks: 8,
    },
    nextIds: {
      household: 12,
      child: 21,
      pairRule: 4,
      schoolEvent: 4,
    },
  };
}