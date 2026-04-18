"use client";

import dynamic from "next/dynamic";

const PlannerApp = dynamic(
  () => import("./PlannerApp").then((module) => module.PlannerApp),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#f4efe3_42%,#ebe7dc_100%)] px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl rounded-[32px] border border-stone-200/80 bg-white/90 p-8 shadow-[0_24px_80px_-32px_rgba(87,58,18,0.45)] backdrop-blur">
          <p className="text-sm font-medium text-stone-600">アプリを読み込んでいます...</p>
        </div>
      </main>
    ),
  },
);

export function PlannerClientShell() {
  return <PlannerApp />;
}