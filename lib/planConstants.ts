export type PlanId = "planA" | "planB" | "planC";

export const PLAN_LABEL: Record<PlanId, string> = {
  planA: "A. 제한적 파트너십",
  planB: "B. 파트너십",
  planC: "C. 전속",
};

export const PLAN_SHORT_DESC: Record<PlanId, string> = {
  planA: "광고·커머스 제안 중심",
  planB: "컨설팅 + 파트너 협업",
  planC: "풀 매니지먼트 전속",
};

export const PLAN_KEY_POINTS: Record<PlanId, string[]> = {
  planA: [
    "전담 매니저가 배정되지 않습니다.",
    "RIZZ의 개입 없이 아티스트가 자체적으로 채널 운영·콘텐츠 기획 및 제작합니다.",
    "아티스트는 자체적으로 광고를 진행할 수 있습니다.",
    "커머스 영업은 RIZZ가 독점으로 진행합니다.",
    "애드센스 및 아티스트가 자체적으로 진행한 광고 수익은 RIZZ와 나누지 않습니다.",
    "단, RIZZ가 영업·제안한 광고 수익은 별도 약정에 따라 나눕니다.",
    "커머스 수익은 건별 협의한 비율로 나눕니다.",
  ],
  planB: [
    "전담 매니저가 배정됩니다.",
    "아티스트의 채널과 콘텐츠에 대한 기획 컨설팅이 포함됩니다.",
    "아티스트는 자체적으로 광고를 진행할 수 있습니다.",
    "커머스 영업은 RIZZ가 독점으로 진행합니다.",
    "애드센스 및 아티스트가 자체적으로 진행한 광고 수익은 RIZZ와 나누지 않습니다.",
    "단, RIZZ가 영업·제안한 광고 수익은 별도 약정에 따라 나눕니다.",
    "커머스 수익은 건별 협의한 비율로 나눕니다.",
  ],
  planC: [
    "전담 매니저가 배정됩니다.",
    "채널 전략·콘텐츠 기획·촬영·편집·운영까지 RIZZ와 함께합니다.",
    "아티스트는 자체적으로 광고·커머스를 진행할 수 없습니다.",
    "애드센스 수익은 전액 아티스트에게 귀속됩니다. (RIZZ와 나누지 않음)",
    "광고·커머스 수익은 RIZZ와 나눕니다.",
  ],
};

export function planHasDedicatedManager(plan: PlanId | null): boolean {
  return plan === "planB" || plan === "planC";
}

export function planIsExclusive(plan: PlanId | null): boolean {
  return plan === "planC";
}

// 계약 기간(년). 시작일은 계약 진행 시점(오늘)으로 자동 설정됩니다.
export const CONTRACT_YEARS = 3;

// 계약 시작일(하드코딩): 2026년 7월 16일
function todayIsoKST(): string {
  return "2026-07-16";
}

// 시작일 기준 N년 뒤 하루 전(만료일)을 계산합니다.
// 예: 2026-06-17 + 3년 → 2029-06-16
function addYearsMinusOneDay(iso: string, years: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y + years, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

// 계약 기간을 반환합니다. 시작일은 항상 '오늘'이며, 만료일은 오늘 + CONTRACT_YEARS − 1일입니다.
export function getPlanContractPeriod(): { start: string; end: string } {
  const start = todayIsoKST();
  return { start, end: addYearsMinusOneDay(start, CONTRACT_YEARS) };
}

export function formatContractDateIso(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return iso;
  return `${y}년 ${m}월 ${d}일`;
}

export type CompareRow = {
  label: string;
  group: string;
  planA: "on" | "limited" | "off" | string;
  planB: "on" | "limited" | "off" | string;
  planC: "on" | "limited" | "off" | string;
};

export const PLAN_COMPARE_ROWS: CompareRow[] = [
  { label: "COSY.AI 이용", group: "기본 제공", planA: "on", planB: "on", planC: "on" },
  { label: "RIZZ 라운지·촬영 공간", group: "기본 제공", planA: "on", planB: "on", planC: "on" },
  { label: "아티스트 콜라보 지원", group: "기본 제공", planA: "on", planB: "on", planC: "on" },
  { label: "네트워킹 행사 참여", group: "기본 제공", planA: "on", planB: "on", planC: "on" },
  { label: "전담 매니저 배정", group: "매니지먼트", planA: "off", planB: "on", planC: "on" },
  { label: "채널·콘텐츠 기획 컨설팅", group: "매니지먼트", planA: "off", planB: "on", planC: "on" },
  { label: "촬영·편집 등 풀 제작 지원", group: "매니지먼트", planA: "off", planB: "off", planC: "협의" },
  { label: "애드센스 수익 분배", group: "수익", planA: "off", planB: "off", planC: "off" },
  { label: "RIZZ 광고 제안·영업", group: "수익", planA: "limited", planB: "on", planC: "on" },
  { label: "광고 자유 활동", group: "수익", planA: "on", planB: "on", planC: "off" },
  { label: "커머스 RIZZ 독점 영업", group: "수익", planA: "on", planB: "on", planC: "on" },
  { label: "독점 계약", group: "계약 조건", planA: "off", planB: "off", planC: "on" },
  { label: "계약 기간", group: "계약 조건", planA: "3년", planB: "3년", planC: "3년" },
];
