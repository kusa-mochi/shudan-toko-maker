import { jsPDF } from "jspdf";
import type { FlagDutyPlan, GroupPlan } from "./plannerTypes";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 15;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_Y = PAGE_HEIGHT - MARGIN_BOTTOM;

let cachedFontBase64: string | null = null;

async function loadFontBase64(): Promise<string> {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  const response = await fetch("/fonts/NotoSansJP-Regular.ttf");

  if (!response.ok) {
    throw new Error("日本語フォントの読み込みに失敗しました。");
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  cachedFontBase64 = btoa(binary);
  return cachedFontBase64;
}

function createPdf(): jsPDF {
  return new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
}

function registerFont(doc: jsPDF, fontBase64: string): void {
  doc.addFileToVFS("NotoSansJP-Regular.ttf", fontBase64);
  doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
  doc.setFont("NotoSansJP", "normal");
}

function ensureY(doc: jsPDF, y: number, requiredHeight: number): number {
  if (y + requiredHeight > MAX_Y) {
    doc.addPage();
    return MARGIN_TOP;
  }

  return y;
}

function drawHorizontalLine(doc: jsPDF, y: number): void {
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + USABLE_WIDTH, y);
}

function drawTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(16);
  doc.text(title, PAGE_WIDTH / 2, y, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `作成日: ${new Date().toLocaleDateString("ja-JP")}`,
    PAGE_WIDTH / 2,
    y + 7,
    { align: "center" },
  );
  doc.setTextColor(0);

  return y + 14;
}

export async function exportGroupPlanToPdf(groupPlan: GroupPlan): Promise<void> {
  const fontBase64 = await loadFontBase64();
  const doc = createPdf();
  registerFont(doc, fontBase64);

  let y = MARGIN_TOP + 5;
  y = drawTitle(doc, "集団登校 班編成表", y);
  y += 2;

  const COL_ORDER_X = MARGIN_LEFT;
  const COL_GRADE_X = MARGIN_LEFT + 14;
  const COL_NAME_X = MARGIN_LEFT + 30;
  const COL_ROLE_X = MARGIN_LEFT + 80;
  const COL_HOUSEHOLD_X = MARGIN_LEFT + 110;

  for (const group of groupPlan.groups) {
    const rowHeight = 6.5;
    const headerHeight = 18;
    const groupHeight = headerHeight + group.members.length * rowHeight + 4;

    y = ensureY(doc, y, groupHeight);

    // Group header
    doc.setFontSize(12);
    doc.text(group.name, MARGIN_LEFT, y);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `${group.members.length}人 / 目安 ${group.targetSize}人`,
      MARGIN_LEFT + doc.getTextWidth(group.name) + 4,
      y,
    );
    doc.setTextColor(0);
    y += 5;

    // Table header
    drawHorizontalLine(doc, y);
    y += 4.5;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("順", COL_ORDER_X, y);
    doc.text("学年", COL_GRADE_X, y);
    doc.text("氏名", COL_NAME_X, y);
    doc.text("役割", COL_ROLE_X, y);
    doc.text("ご家庭", COL_HOUSEHOLD_X, y);
    doc.setTextColor(0);
    y += 2;
    drawHorizontalLine(doc, y);
    y += 4.5;

    // Members
    doc.setFontSize(9.5);

    for (const [index, member] of group.members.entries()) {
      y = ensureY(doc, y, rowHeight);

      const role =
        member.id === group.leaderId
          ? "先頭"
          : member.id === group.rearId
            ? "最後尾"
            : `中央 ${index}`;

      doc.text(`${index + 1}`, COL_ORDER_X, y);
      doc.text(`${member.grade}年`, COL_GRADE_X, y);
      doc.text(member.name || "氏名未入力", COL_NAME_X, y);
      doc.text(role, COL_ROLE_X, y);
      doc.text(member.householdName || "—", COL_HOUSEHOLD_X, y);
      y += rowHeight;
    }

    drawHorizontalLine(doc, y - 2.5);
    y += 6;
  }

  if (groupPlan.warnings.length > 0) {
    y = ensureY(doc, y, 10 + groupPlan.warnings.length * 5);
    doc.setFontSize(9);
    doc.setTextColor(150, 100, 0);
    doc.text("⚠ 注意事項:", MARGIN_LEFT, y);
    y += 5;

    for (const warning of groupPlan.warnings) {
      y = ensureY(doc, y, 5);
      doc.text(`・${warning}`, MARGIN_LEFT + 2, y);
      y += 5;
    }

    doc.setTextColor(0);
  }

  doc.save("班編成表.pdf");
}

export async function exportFlagDutyPlanToPdf(
  flagDutyPlan: FlagDutyPlan,
): Promise<void> {
  const fontBase64 = await loadFontBase64();
  const doc = createPdf();
  registerFont(doc, fontBase64);

  let y = MARGIN_TOP + 5;
  y = drawTitle(doc, "旗当番表", y);
  y += 2;

  if (flagDutyPlan.slots.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      "旗当番の割り当てがありません。",
      PAGE_WIDTH / 2,
      y + 10,
      { align: "center" },
    );
    doc.save("旗当番表.pdf");
    return;
  }

  const COL_WEEK_X = MARGIN_LEFT;
  const COL_DATE_X = MARGIN_LEFT + 14;
  const COL_HOUSEHOLD_X = MARGIN_LEFT + 52;
  const COL_EVENT_X = MARGIN_LEFT + 100;
  const COL_COUNT_X = MARGIN_LEFT + 155;

  // Table header
  drawHorizontalLine(doc, y);
  y += 4.5;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("週", COL_WEEK_X, y);
  doc.text("日付", COL_DATE_X, y);
  doc.text("担当家庭", COL_HOUSEHOLD_X, y);
  doc.text("同週の行事", COL_EVENT_X, y);
  doc.text("累計", COL_COUNT_X, y);
  doc.setTextColor(0);
  y += 2;
  drawHorizontalLine(doc, y);
  y += 4.5;

  const rowHeight = 6.5;

  for (const [index, slot] of flagDutyPlan.slots.entries()) {
    y = ensureY(doc, y, rowHeight);

    if (y === MARGIN_TOP) {
      // Re-draw header on new page
      drawHorizontalLine(doc, y);
      y += 4.5;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("週", COL_WEEK_X, y);
      doc.text("日付", COL_DATE_X, y);
      doc.text("担当家庭", COL_HOUSEHOLD_X, y);
      doc.text("同週の行事", COL_EVENT_X, y);
      doc.text("累計", COL_COUNT_X, y);
      doc.setTextColor(0);
      y += 2;
      drawHorizontalLine(doc, y);
      y += 4.5;
    }

    doc.setFontSize(9.5);
    doc.text(`${index + 1}`, COL_WEEK_X, y);
    doc.text(slot.dateLabel, COL_DATE_X, y);
    doc.text(slot.householdName || "—", COL_HOUSEHOLD_X, y);

    const eventText = slot.blockedEvents.length > 0 ? slot.blockedEvents.join(", ") : "";
    doc.setFontSize(8);
    doc.text(eventText, COL_EVENT_X, y);

    doc.setFontSize(9.5);
    doc.text(
      slot.totalDutyCount !== null ? `${slot.totalDutyCount}回` : "—",
      COL_COUNT_X,
      y,
    );

    y += rowHeight;
  }

  drawHorizontalLine(doc, y - 2.5);
  y += 6;

  if (flagDutyPlan.warnings.length > 0) {
    y = ensureY(doc, y, 10 + flagDutyPlan.warnings.length * 5);
    doc.setFontSize(9);
    doc.setTextColor(150, 100, 0);
    doc.text("⚠ 注意事項:", MARGIN_LEFT, y);
    y += 5;

    for (const warning of flagDutyPlan.warnings) {
      y = ensureY(doc, y, 5);
      const lines = doc.splitTextToSize(`・${warning}`, USABLE_WIDTH - 4);
      doc.text(lines, MARGIN_LEFT + 2, y);
      y += lines.length * 4.5;
    }

    doc.setTextColor(0);
  }

  doc.save("旗当番表.pdf");
}
