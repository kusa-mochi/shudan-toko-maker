"use client";

import { useState } from "react";
import { usePlannerContext } from "./PlannerContext";
import { exportGroupPlanToPdf, exportFlagDutyPlanToPdf } from "./plannerPdf";

export function PdfExportCard() {
  const { groupPlan, flagDutyPlan, households } = usePlannerContext();
  const [generating, setGenerating] = useState<"group" | "duty" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExportGroupPlan = async () => {
    setGenerating("group");
    setError(null);

    try {
      await exportGroupPlanToPdf(groupPlan);
    } catch {
      setError("班編成PDFの生成に失敗しました。");
    } finally {
      setGenerating(null);
    }
  };

  const handleExportFlagDuty = async () => {
    setGenerating("duty");
    setError(null);

    try {
      await exportFlagDutyPlanToPdf(flagDutyPlan, households);
    } catch {
      setError("旗当番表PDFの生成に失敗しました。");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="rounded-[28px] border border-stone-200/90 bg-white/75 p-4 backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">PDFファイル</h3>
          <p className="mt-0.5 text-xs text-stone-500">
            生成結果をPDFファイルとしてダウンロードできます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleExportGroupPlan}
            disabled={generating !== null}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-900 disabled:opacity-40"
          >
            {generating === "group" ? "生成中…" : "班編成"}
          </button>
          <button
            type="button"
            onClick={handleExportFlagDuty}
            disabled={generating !== null}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-900 disabled:opacity-40"
          >
            {generating === "duty" ? "生成中…" : "旗当番表"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
