import { jsPDF } from "jspdf";
import type { FlagDutyPlan, GeneratedGroup, Grade, GroupPlan } from "./plannerTypes";

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

const GRADE_CIRCLE_COLORS: Record<number, [number, number, number]> = {
  1: [245, 158, 11],
  2: [34, 211, 238],
  3: [59, 130, 246],
  4: [234, 179, 8],
  5: [34, 197, 94],
  6: [249, 115, 22],
};

const GROUP_COL_GAP = 4;
const GROUP_MIN_COL_WIDTH = 32;
const GROUP_HEADER_H = 9;
const GROUP_CELL_H = 11;
const GROUP_ROW_GAP = 10;
const GRADE_CIRCLE_R = 3;
const ROLE_AREA_W = 10;

function drawFlagIcon(doc: jsPDF, x: number, y: number): void {
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.4);
  doc.line(x, y, x, y + 6);

  doc.setFillColor(220, 70, 50);
  doc.triangle(x + 0.3, y, x + 4.2, y + 1.3, x + 0.3, y + 2.6, "F");
}

function drawGradeCircle(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  grade: Grade,
): void {
  const color = GRADE_CIRCLE_COLORS[grade] ?? [150, 150, 150];
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(centerX, centerY, GRADE_CIRCLE_R, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`${grade}`, centerX, centerY + 1, { align: "center" });
  doc.setTextColor(0);
}

function drawGroupColumn(
  doc: jsPDF,
  group: GeneratedGroup,
  colX: number,
  startY: number,
  colWidth: number,
): void {
  let y = startY;

  doc.setFillColor(230, 230, 230);
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.rect(colX, y, colWidth, GROUP_HEADER_H, "FD");

  doc.setFontSize(9);
  doc.setTextColor(50);
  doc.text(
    `${group.name}（${group.members.length}人）`,
    colX + colWidth / 2,
    y + 6,
    { align: "center" },
  );
  doc.setTextColor(0);
  y += GROUP_HEADER_H;

  for (const member of group.members) {
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.rect(colX, y, colWidth, GROUP_CELL_H, "S");

    const isLeader = member.id === group.leaderId;
    const isRear = member.id === group.rearId;

    if (isLeader || isRear) {
      drawFlagIcon(doc, colX + 2.5, y + 1.5);
      doc.setFontSize(4.5);
      doc.setTextColor(80);
      doc.text(isLeader ? "班長" : "副班長", colX + 1.5, y + 9.5);
      doc.setTextColor(0);

      doc.setFontSize(9);
      doc.text(member.name || "氏名未入力", colX + ROLE_AREA_W + 1, y + 6.5);
    } else {
      doc.setFontSize(9);
      doc.text(member.name || "氏名未入力", colX + 4, y + 6.5);
    }

    drawGradeCircle(doc, colX + colWidth - 6.5, y + GROUP_CELL_H / 2, member.grade);
    y += GROUP_CELL_H;
  }
}

export async function exportGroupPlanToPdf(groupPlan: GroupPlan): Promise<void> {
  const fontBase64 = await loadFontBase64();
  const doc = createPdf();
  registerFont(doc, fontBase64);

  const groups = groupPlan.groups;
  const now = new Date();

  let y = MARGIN_TOP + 5;
  const fiscalYear =
    now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const reiwaYear = fiscalYear - 2018;

  doc.setFontSize(16);
  doc.text(
    `令和${reiwaYear}年度 登校班の並び順`,
    PAGE_WIDTH / 2,
    y,
    { align: "center" },
  );
  y += 12;

  if (groups.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("班がありません。", PAGE_WIDTH / 2, y + 10, { align: "center" });
    doc.save("班編成表.pdf");
    return;
  }

  const MAX_COLS_PER_ROW = 4;
  const maxColsPerRow = Math.min(groups.length, MAX_COLS_PER_ROW);
  const colWidth =
    (USABLE_WIDTH - (maxColsPerRow - 1) * GROUP_COL_GAP) / maxColsPerRow;

  const groupRows: GeneratedGroup[][] = [];

  for (let i = 0; i < groups.length; i += maxColsPerRow) {
    groupRows.push(groups.slice(i, i + maxColsPerRow));
  }

  for (const row of groupRows) {
    const maxMembersInRow = Math.max(...row.map((g) => g.members.length));
    const rowTotalHeight =
      GROUP_HEADER_H + maxMembersInRow * GROUP_CELL_H;

    if (y + rowTotalHeight > MAX_Y) {
      doc.addPage();
      y = MARGIN_TOP;
    }

    for (const [colIndex, group] of row.entries()) {
      const colX = MARGIN_LEFT + colIndex * (colWidth + GROUP_COL_GAP);
      drawGroupColumn(doc, group, colX, y, colWidth);
    }

    y += rowTotalHeight + GROUP_ROW_GAP;
  }

  y -= GROUP_ROW_GAP;
  y += 4;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(
    `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`,
    MARGIN_LEFT + USABLE_WIDTH,
    y,
    { align: "right" },
  );
  y += 10;

  // --- 注意事項 ---
  const noticeItems = [
    "A班の班長がお休みの場合は、各班の班長(6年生優先)が先頭に入ってください。",
    "各班の班長がお休みの場合も、副班長はそのまま後ろについてください。",
  ];
  const noticeNote =
    "※各班の班長がお休みの時に副班長が先頭にくるというルールは廃止しています";

  if (y + 50 > MAX_Y) {
    doc.addPage();
    y = MARGIN_TOP;
  }

  drawHorizontalLine(doc, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("注意事項", PAGE_WIDTH / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);

  for (const item of noticeItems) {
    if (y + 8 > MAX_Y) {
      doc.addPage();
      y = MARGIN_TOP;
    }

    const lines = doc.splitTextToSize(`●${item}`, USABLE_WIDTH - 8);
    doc.text(lines, MARGIN_LEFT + 4, y);
    y += lines.length * 6;
  }

  y += 2;
  doc.setFontSize(9);
  const noteLines = doc.splitTextToSize(noticeNote, USABLE_WIDTH - 12);
  doc.text(noteLines, MARGIN_LEFT + 8, y);
  y += noteLines.length * 5 + 4;

  // App warnings (if any)
  if (groupPlan.warnings.length > 0) {
    for (const warning of groupPlan.warnings) {
      if (y + 8 > MAX_Y) {
        doc.addPage();
        y = MARGIN_TOP;
      }

      doc.setFontSize(10);
      const wLines = doc.splitTextToSize(`●${warning}`, USABLE_WIDTH - 8);
      doc.text(wLines, MARGIN_LEFT + 4, y);
      y += wLines.length * 6;
    }

    y += 4;
  }

  // --- お約束 ---
  const promiseItems = [
    "下を向かずに前を向いて歩いて、周りをよく見て危険なことがないか注意しましょう。遅刻やあせっている時に、走って人や車にぶつからないように気をつけましょう。",
    "通行する人のじゃまにならないように歩道に広がらないようにしましょう。",
    "決められた通学路を通って、安全のため2人以上で登下校しましょう。",
    "大人はこまっている時に、子どもに助けをもとめることはぜったいにありません。知らない大人から声をかけられてもぜったいについていきません。",
    "こわい時はにげるか、大きな声を出すか、ぼうはんブザーを鳴らして、自分の命をしっかり守りましょう。",
  ];

  if (y + 20 > MAX_Y) {
    doc.addPage();
    y = MARGIN_TOP;
  }

  drawHorizontalLine(doc, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("お約束", PAGE_WIDTH / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);

  for (const item of promiseItems) {
    if (y + 8 > MAX_Y) {
      doc.addPage();
      y = MARGIN_TOP;
    }

    const lines = doc.splitTextToSize(`● ${item}`, USABLE_WIDTH - 8);
    doc.text(lines, MARGIN_LEFT + 4, y);
    y += lines.length * 5.5 + 2;
  }

  y += 4;

  // --- フッター ---
  if (y + 20 > MAX_Y) {
    doc.addPage();
    y = MARGIN_TOP;
  }

  drawHorizontalLine(doc, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(
    "ご意見やお困りごと等がございましたら、地域委員までご連絡ください。",
    MARGIN_LEFT,
    y,
  );
  y += 6;

  doc.text(`◎令和${reiwaYear}年度 地域委員`, MARGIN_LEFT, y);
  doc.setTextColor(0);

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
