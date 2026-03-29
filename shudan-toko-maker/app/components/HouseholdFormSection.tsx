import type { Grade, Household } from "./plannerTypes";
import { HouseholdEditorCard } from "./HouseholdEditorCard";

type HouseholdFormSectionProps = {
  households: Household[];
  onAddHousehold: () => void;
  onRemoveHousehold: (householdId: string) => void;
  onUpdateHouseholdText: (householdId: string, field: "householdName" | "memo", value: string) => void;
  onUpdateHouseholdDutyCount: (householdId: string, value: string) => void;
  onAddChild: (householdId: string) => void;
  onUpdateChildName: (householdId: string, childId: string, name: string) => void;
  onUpdateChildGrade: (householdId: string, childId: string, grade: Grade) => void;
  onRemoveChild: (householdId: string, childId: string) => void;
};

export function HouseholdFormSection(props: HouseholdFormSectionProps) {
  const {
    households,
    onAddHousehold,
    onRemoveHousehold,
    onUpdateHouseholdText,
    onUpdateHouseholdDutyCount,
    onAddChild,
    onUpdateChildName,
    onUpdateChildGrade,
    onRemoveChild,
  } = props;

  return (
    <div className="space-y-4">
      {households.map((household, householdIndex) => (
        <HouseholdEditorCard
          key={household.id}
          household={household}
          householdIndex={householdIndex}
          onRemoveHousehold={onRemoveHousehold}
          onUpdateHouseholdText={onUpdateHouseholdText}
          onUpdateHouseholdDutyCount={onUpdateHouseholdDutyCount}
          onAddChild={onAddChild}
          onUpdateChildName={onUpdateChildName}
          onUpdateChildGrade={onUpdateChildGrade}
          onRemoveChild={onRemoveChild}
        />
      ))}

      <button
        type="button"
        onClick={onAddHousehold}
        className="flex w-full items-center justify-center rounded-[28px] border border-dashed border-stone-400 bg-white/70 px-6 py-5 text-base font-semibold text-stone-800 transition hover:border-stone-900 hover:bg-white"
      >
        家庭を追加する
      </button>
    </div>
  );
}