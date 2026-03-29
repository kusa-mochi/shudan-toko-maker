"use client";

import { gradeOptions } from "./plannerTypes";
import { usePlannerContext } from "./PlannerContext";

export function SchoolEventsPanel() {
  const {
    schoolEvents,
    addSchoolEvent,
    updateSchoolEventText,
    toggleEventGrade,
    removeSchoolEvent,
  } = usePlannerContext();

  return (
    <section className="rounded-[32px] border border-stone-200/90 bg-white/85 p-5 shadow-[0_18px_45px_-35px_rgba(87,58,18,0.45)] backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">学校行事</h2>
        </div>
        <button
          type="button"
          onClick={addSchoolEvent}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          行事を追加
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        対象学年が行事で動けない週は、その学年の児童がいる家庭を旗当番候補から外します。
      </p>

      <div className="mt-5 space-y-3">
        {schoolEvents.length === 0 ? (
          <p className="rounded-3xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            まだ学校行事はありません。必要な行事だけ追加してください。
          </p>
        ) : null}

        {schoolEvents.map((eventItem) => (
          <div key={eventItem.id} className="rounded-3xl bg-stone-50 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-stone-700">
                行事名
                <input
                  type="text"
                  value={eventItem.title}
                  onChange={(event) => updateSchoolEventText(eventItem.id, "title", event.target.value)}
                  placeholder="例: 修学旅行"
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-stone-700">
                日付
                <input
                  type="date"
                  value={eventItem.date}
                  onChange={(event) => updateSchoolEventText(eventItem.id, "date", event.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-amber-500"
                />
              </label>
            </div>

            <div className="mt-3">
              <p className="text-sm font-medium text-stone-700">対象学年</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {gradeOptions.map((grade) => {
                  const checked = eventItem.targetGrades.includes(grade.value);

                  return (
                    <label
                      key={grade.value}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                        checked
                          ? "border-amber-500 bg-amber-100 text-amber-900"
                          : "border-stone-300 bg-white text-stone-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEventGrade(eventItem.id, grade.value)}
                        className="h-4 w-4 accent-amber-600"
                      />
                      {grade.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
                      onClick={() => removeSchoolEvent(eventItem.id)}
              className="mt-3 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
            >
              この行事を削除
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}