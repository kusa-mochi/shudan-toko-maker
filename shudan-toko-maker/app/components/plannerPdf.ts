import { jsPDF } from "jspdf";
import type { FlagDutyPlan, GeneratedGroup, Grade, GroupPlan, Household } from "./plannerTypes";

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

const GRADE_CIRCLE_COLORS: Record<number, { fill: [number, number, number]; text: [number, number, number] }> = {
  1: { fill: [245, 158, 11],  text: [30, 30, 30] },
  2: { fill: [34, 211, 238],  text: [30, 30, 30] },
  3: { fill: [59, 130, 246],  text: [255, 255, 255] },
  4: { fill: [234, 179, 8],   text: [30, 30, 30] },
  5: { fill: [34, 197, 94],   text: [30, 30, 30] },
  6: { fill: [249, 115, 22],  text: [255, 255, 255] },
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
  const entry = GRADE_CIRCLE_COLORS[grade] ?? {
    fill: [150, 150, 150] as [number, number, number],
    text: [255, 255, 255] as [number, number, number],
  };
  doc.setFillColor(entry.fill[0], entry.fill[1], entry.fill[2]);
  doc.circle(centerX, centerY, GRADE_CIRCLE_R, "F");

  // Use a bold latin font for the single-digit grade marker to improve legibility.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(entry.text[0], entry.text[1], entry.text[2]);
  doc.text(`${grade}`, centerX, centerY + 1, { align: "center" });

  // Restore the Japanese text font used by the rest of the document.
  doc.setFont("NotoSansJP", "normal");
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
      doc.text(member.name || "氏名未入力", colX + ROLE_AREA_W + 1, y + 6.5);
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

  const promiseBulletX = MARGIN_LEFT + 4;
  const promiseTextX = promiseBulletX + 4;
  const promiseLineHeight = 5.5;
  const promiseTextWidth = MARGIN_LEFT + USABLE_WIDTH - promiseTextX;

  for (const item of promiseItems) {
    const lines = doc.splitTextToSize(item, promiseTextWidth);
    const blockHeight = Math.max(promiseLineHeight, lines.length * promiseLineHeight) + 2;

    if (y + blockHeight > MAX_Y) {
      doc.addPage();
      y = MARGIN_TOP;
    }

    doc.text("●", promiseBulletX, y);
    doc.text(lines, promiseTextX, y);
    y += blockHeight;
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
  households: Household[],
): Promise<void> {
  const fontBase64 = await loadFontBase64();
  const doc = createPdf();
  registerFont(doc, fontBase64);

  const now = new Date();
  const fiscalYear =
    now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const reiwaYear = fiscalYear - 2018;

  if (flagDutyPlan.slots.length === 0) {
    let y = MARGIN_TOP + 5;
    y = drawTitle(doc, "旗当番表", y);
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

  // --- Pivot: group duty dates by household ---
  const householdDutyMap = new Map<
    string,
    {
      householdName: string;
      addressOrRoom: string;
      householdId: string;
      dates: string[];
    }
  >();
  const householdOrder: string[] = [];

  for (const slot of flagDutyPlan.slots) {
    const key = slot.householdId || slot.householdName;
    if (!householdDutyMap.has(key)) {
      householdDutyMap.set(key, {
        householdName: slot.householdName,
        addressOrRoom: slot.addressOrRoom,
        householdId: slot.householdId || "",
        dates: [],
      });
      householdOrder.push(key);
    }
    const shortDate = slot.dateLabel.replace(/\(.*?\)$/, "").trim();
    householdDutyMap.get(key)!.dates.push(shortDate);
  }

  // --- Build display rows ---
  type DutyRow = {
    householdName: string;
    addressOrRoom: string;
    grades: string;
    phone: string;
    dates: string[];
    isCommittee: boolean;
  };

  const dutyRows: DutyRow[] = [];
  for (const [idx, key] of householdOrder.entries()) {
    const entry = householdDutyMap.get(key)!;
    const household = households.find(
      (h) =>
        h.id === entry.householdId ||
        h.householdName === entry.householdName,
    );
    const grades = household
      ? household.children
          .map((c) => c.grade)
          .sort((a, b) => a - b)
          .join("・")
      : "";

    dutyRows.push({
      householdName: household?.householdName || entry.householdName,
      addressOrRoom: household?.addressOrRoom || entry.addressOrRoom,
      grades,
      phone: "090-1234-5678",
      dates: entry.dates,
      isCommittee: idx % 4 === 1,
    });
  }

  const maxDateCols = Math.max(...dutyRows.map((r) => r.dates.length), 1);
  const totalChildren = households.reduce(
    (sum, h) => sum + h.children.length,
    0,
  );

  // --- Column layout ---
  const COL_NAME_W = 34; // combined surname + room number
  const COL_GRADE_W = 16;
  const COL_PHONE_W = 34;
  const dateAreaW =
    USABLE_WIDTH - COL_NAME_W - COL_GRADE_W - COL_PHONE_W;
  const COL_DATE_W = dateAreaW / maxDateCols;
  const ROW_H = 8.5;

  // ============================
  // TOP INSTRUCTIONS (outside box)
  // ============================
  let y = MARGIN_TOP + 3;

  doc.setFontSize(9.5);
  doc.setTextColor(0);
  doc.text(
    "朝の声かけは従来通り。下校時は、低学年(1・2年)の下校時に声かけするのが望ましいが、",
    MARGIN_LEFT,
    y,
  );
  y += 5.5;
  doc.text(
    "当番の人の立てる時間で結構です。当番日の月曜日に立てない場合は、次の当番の人へ",
    MARGIN_LEFT,
    y,
  );
  y += 5.5;
  doc.text(
    "かばんを引き継ぐまでに、下校時の声かけをお願いします。(都合のいい日で結構です)",
    MARGIN_LEFT,
    y,
  );
  y += 8;

  doc.setFontSize(10);
  doc.text(
    "＊必ず たすき・腕章をつけてください！",
    PAGE_WIDTH - MARGIN_RIGHT,
    y,
    { align: "right" },
  );
  y += 5;

  // ============================
  // BORDERED BOX
  // ============================
  const boxX = MARGIN_LEFT;
  const boxW = USABLE_WIDTH;
  const boxStartY = y;

  // Title inside box
  y += 10;
  doc.setFontSize(16);
  doc.text("『朝・下校時の声かけ』当番表", boxX + 8, y);

  doc.setFontSize(10);
  doc.text(
    `令和${reiwaYear}年度 AI小学校PTA活動`,
    boxX + boxW - 5,
    y,
    { align: "right" },
  );
  y += 9;

  // Town info
  doc.setFontSize(10);
  doc.text(
    `町名：〇×マンション（△△△町）＜${dutyRows.length}軒 ${totalChildren}名＞`,
    boxX + 5,
    y,
  );
  y += 6;

  // Meeting point info
  doc.setFontSize(8);
  doc.text("◎声掛場所/〇〇交差点", boxX + 2, y);
  doc.text("◎時刻/7:50～8:00", boxX + 38, y);
  doc.text("◎集合場所/□□□", boxX + 95, y);
  doc.text("◎時刻/7:45", boxX + 125, y);
  y += 3;

  // ============================
  // TABLE
  // ============================
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);

  // --- Header row ---
  let cellX = boxX;
  const nameHalf = COL_NAME_W / 2;

  doc.rect(cellX, y, COL_NAME_W, ROW_H, "S");
  doc.setFontSize(9);
  doc.text("\u6C0F\u540D", cellX + COL_NAME_W / 2, y + ROW_H * 0.65, {
    align: "center",
  });
  cellX += COL_NAME_W;

  doc.rect(cellX, y, COL_GRADE_W, ROW_H, "S");
  doc.text("学年", cellX + COL_GRADE_W / 2, y + ROW_H * 0.65, {
    align: "center",
  });
  cellX += COL_GRADE_W;

  doc.rect(cellX, y, COL_PHONE_W, ROW_H, "S");
  doc.text("電話番号", cellX + COL_PHONE_W / 2, y + ROW_H * 0.65, {
    align: "center",
  });
  cellX += COL_PHONE_W;

  doc.rect(cellX, y, dateAreaW, ROW_H, "S");
  doc.text("担当日", cellX + dateAreaW / 2, y + ROW_H * 0.65, {
    align: "center",
  });

  y += ROW_H;

  // --- Data rows ---
  for (const row of dutyRows) {
    cellX = boxX;

    // Name cell (household name | dotted line | address/room)
    doc.rect(cellX, y, COL_NAME_W, ROW_H, "S");
    // Dotted divider line in the middle
    doc.setDrawColor(160);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(cellX + nameHalf, y, cellX + nameHalf, y + ROW_H);
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(0);
    // Household name (left half)
    doc.setFontSize(11);
    const baseName = row.householdName || "未入力";
    const displayName = row.isCommittee ? `\u25CE${baseName}` : baseName;
    doc.text(displayName, cellX + nameHalf / 2, y + ROW_H * 0.65, {
      align: "center",
    });
    // Address / room number (right half)
    doc.setFontSize(9);
    doc.text(row.addressOrRoom, cellX + nameHalf + nameHalf / 2, y + ROW_H * 0.65, {
      align: "center",
    });
    cellX += COL_NAME_W;

    // Grade
    doc.rect(cellX, y, COL_GRADE_W, ROW_H, "S");
    doc.text(row.grades, cellX + COL_GRADE_W / 2, y + ROW_H * 0.65, {
      align: "center",
    });
    cellX += COL_GRADE_W;

    // Phone
    doc.rect(cellX, y, COL_PHONE_W, ROW_H, "S");
    doc.text(row.phone, cellX + COL_PHONE_W / 2, y + ROW_H * 0.65, {
      align: "center",
    });
    cellX += COL_PHONE_W;

    // Date cells
    for (let i = 0; i < maxDateCols; i++) {
      doc.rect(cellX, y, COL_DATE_W, ROW_H, "S");
      if (i < row.dates.length) {
        doc.setFontSize(9.5);
        doc.text(row.dates[i], cellX + COL_DATE_W / 2, y + ROW_H * 0.65, {
          align: "center",
        });
      }
      cellX += COL_DATE_W;
    }

    y += ROW_H;
  }

  // --- Draw outer box border ---
  const boxEndY = y;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(boxX, boxStartY, boxW, boxEndY - boxStartY, "S");

  // ============================
  // BOTTOM TEXT (outside box)
  // ============================
  y += 10;

  doc.setFontSize(9.5);
  doc.setTextColor(0);
  doc.text(
    "＊個人情報保護法により、名簿の取り扱いには十分にご注意下さい！！",
    PAGE_WIDTH / 2,
    y,
    { align: "center" },
  );
  y += 6;
  doc.text("年度末に各自で処分をお願いします。", PAGE_WIDTH / 2, y, {
    align: "center",
  });
  y += 12;

  doc.setFontSize(9.5);
  doc.text(
    "『おはよう！』『気をつけて、いってらっしゃい！』『おかえり！』の声かけをお願いします。",
    MARGIN_LEFT,
    y,
  );
  y += 5.5;
  doc.text(
    "危険な歩き方、他の人に迷惑な行為には必ず注意してあげて下さい。",
    MARGIN_LEFT,
    y,
  );
  y += 5.5;
  doc.text(
    "親御さんも月曜日の忙しい時間に大変だと思いますが、何卒よろしくご協力お願いします。",
    MARGIN_LEFT,
    y,
  );
  y += 12;

  doc.setFontSize(9.5);
  doc.text(
    "＊旗当番に立てない場合、地域委員に相談するか代わりの方にお願いして下さい。",
    MARGIN_LEFT,
    y,
  );
  y += 5.5;
  doc.text(
    "交代できる方が誰もいない場合、その日は当番無しでこども達だけで出発します。",
    MARGIN_LEFT + 4,
    y,
  );

  doc.save("旗当番表.pdf");
}
