"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { usePlannerContext } from "./PlannerContext";

export function DataFileToolbar() {
  const { exportInputToJson, importInputFromJson } = usePlannerContext();
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);
  const [jsonFeedback, setJsonFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleJsonImportClick = () => {
    jsonFileInputRef.current?.click();
  };

  const handleJsonFileSelected = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const jsonText = await file.text();
      const result = importInputFromJson(jsonText);

      setJsonFeedback({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch {
      setJsonFeedback({
        type: "error",
        message: "JSONファイルの読み込みに失敗しました。",
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-[28px] border border-stone-200/90 bg-white/75 p-4 backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          データ入力と生成結果をまとめて保存・読込できます。「サンプルファイルをダウンロード」で入力例を確認できます。
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={exportInputToJson}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-900"
          >
            保存
          </button>
          <button
            type="button"
            onClick={handleJsonImportClick}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-900"
          >
            開く
          </button>
          <a
            href="/toban_sample.json"
            download
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-900"
          >
            サンプルファイルをダウンロード
          </a>
        </div>
      </div>

      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleJsonFileSelected}
        className="hidden"
      />

      {jsonFeedback ? (
        <p
          className={`mt-3 rounded-2xl px-3 py-2 text-sm ${
            jsonFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-900"
          }`}
        >
          {jsonFeedback.message}
        </p>
      ) : null}
    </div>
  );
}
