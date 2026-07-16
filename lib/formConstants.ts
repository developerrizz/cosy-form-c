export type ContentValue = "full" | "consult" | "none";
export type RevenueValue = "full" | "partial";
export type BenefitStatus = "on" | "limited" | "off";

// ── Plan A/B/C 매핑 ──────────────────────────────────────────
export type PlanId = "planA" | "planB" | "planC";

export type RevenueChoice = "free" | "partner";
export type ContentChoice = "none" | "consult" | "full";

export const REVENUE_CHOICE_LABELS: Record<RevenueChoice, { label: string; desc: string }> = {
  free: {
    label: "자유롭게 하고 싶어요",
    desc: "광고는 자유롭게 진행할 수 있고, 커머스는 RIZZ가 독점으로 영업합니다.",
  },
  partner: {
    label: "RIZZ에 전부 맡기고 싶어요",
    desc: "광고·커머스 영업을 RIZZ가 전담하여 수익 기회를 적극적으로 만들어드려요",
  },
};

export const CONTENT_CHOICE_LABELS: Record<ContentChoice, { label: string; desc: string }> = {
  none: {
    label: "채널/콘텐츠는 알아서 할 수 있어요",
    desc: "채널 운영·콘텐츠 기획 및 제작은 아티스트가 직접 하고, RIZZ는 관여하지 않아요.",
  },
  consult: {
    label: "채널 및 콘텐츠 컨설팅만 받고 싶어요.",
    desc: "RIZZ가 채널 세계관 및 기획에 대한 코칭을 제공하지만, 콘텐츠 제작은 아티스트가 직접 해요.",
  },
  full: {
    label: "채널 운영, 콘텐츠 기획부터 제작까지 전부 RIZZ에 맡기고 싶어요",
    desc: "채널 전략부터 콘텐츠 기획, 촬영, 편집까지 RIZZ가 함께합니다.",
  },
};

export const CONTRACT_TYPE_NAMES: Record<PlanId, string> = {
  planA: "제한적 파트너십",
  planB: "파트너십",
  planC: "전속",
};

export const CONTRACT_TYPE_CODES: Record<PlanId, string> = {
  planA: "LITE",
  planB: "PARTNER",
  planC: "ALL-IN",
};

export const CONTRACT_TYPE_DESC: Record<PlanId, string> = {
  planA: "아티스트가 자체적으로 채널 운영·콘텐츠 기획 및 제작하며, 수익활동은 자유롭게, RIZZ도 광고·커머스를 제안합니다.",
  planB: "전담 매니저 배정 + 기획 컨설팅 제공. 수익활동은 자유롭게, RIZZ도 광고·커머스를 제안합니다.",
  planC: "채널 운영, 콘텐츠 기획/제작부터 수익활동까지 모두 RIZZ와 함께합니다.",
};

export type BenefitRow = { label: string; status: BenefitStatus };

export const PLAN_BENEFITS: Record<PlanId, BenefitRow[]> = {
  planA: [
    { label: "전담 매니저 배정", status: "off" },
    { label: "채널·콘텐츠 기획 컨설팅", status: "off" },
    { label: "촬영·편집 등 제작 지원", status: "off" },
    { label: "RIZZ의 광고 영업·제안", status: "limited" },
    { label: "애드센스 수익 배분", status: "off" },
    { label: "광고 자유 활동", status: "on" },
    { label: "커머스 RIZZ 독점 영업", status: "on" },
    { label: "COSY.AI 이용", status: "on" },
    { label: "RIZZ 라운지·촬영 공간", status: "on" },
  ],
  planB: [
    { label: "전담 매니저 배정", status: "on" },
    { label: "채널·콘텐츠 기획 컨설팅", status: "on" },
    { label: "촬영·편집 등 제작 지원", status: "off" },
    { label: "RIZZ의 광고 영업·제안", status: "on" },
    { label: "애드센스 수익 배분", status: "off" },
    { label: "광고 자유 활동", status: "on" },
    { label: "커머스 RIZZ 독점 영업", status: "on" },
    { label: "COSY.AI 이용", status: "on" },
    { label: "RIZZ 라운지·촬영 공간", status: "on" },
  ],
  planC: [
    { label: "전담 매니저 배정", status: "on" },
    { label: "채널·콘텐츠 기획 컨설팅", status: "on" },
    { label: "촬영·편집 등 제작 지원", status: "limited" },
    { label: "RIZZ가 광고·커머스 영업 전담", status: "on" },
    { label: "애드센스 수익 배분", status: "off" },
    { label: "아티스트의 자유로운 수익활동", status: "off" },
    { label: "COSY.AI 이용", status: "on" },
    { label: "RIZZ 라운지·촬영 공간", status: "on" },
  ],
};

// ── 기존 코드 호환용 (삭제하지 말 것) ────────────────────────
export const CONTRACT_TYPES: Record<string, { code: string; name: string; exclusive: boolean; desc: string }> = {
  "none-partial": { code: "LITE", name: "제한적 파트너십", exclusive: false, desc: CONTRACT_TYPE_DESC.planA },
  "consult-partial": { code: "PARTNER", name: "파트너십", exclusive: false, desc: CONTRACT_TYPE_DESC.planB },
  "full-full": { code: "ALL-IN", name: "전속", exclusive: true, desc: CONTRACT_TYPE_DESC.planC },
  "full-partial": { code: "ALL-IN", name: "전속", exclusive: true, desc: CONTRACT_TYPE_DESC.planC },
};

export const CONTENT_LABELS: Record<ContentValue, string> = {
  full: "채널 운영 + 콘텐츠 기획/제작 전부 위임",
  consult: "기획 컨설팅만",
  none: "직접 진행",
};

export const REVENUE_LABELS: Record<RevenueValue, string> = {
  full: "RIZZ에 전담 위임",
  partial: "자유롭게 (건별 협업)",
};

export const CONTRACT_CONTENT_LABELS: Record<ContentValue, string> = {
  full: "채널 운영 + 기획/제작 전체 대행",
  consult: "기획 컨설팅",
  none: "해당 없음",
};

export const CONTENT_BENEFITS: { label: string; full: BenefitStatus; consult: BenefitStatus; none: BenefitStatus }[] = [
  { label: "전담 매니저 배정", full: "on", consult: "on", none: "off" },
  { label: "채널 기획/운영 및 관리", full: "on", consult: "off", none: "off" },
  { label: "콘텐츠 기획 및 제작", full: "on", consult: "off", none: "off" },
  { label: "채널 컨설팅 (세계관 & 기획 피드백)", full: "on", consult: "on", none: "off" },
  { label: "촬영/편집 지원 (비용 별도 협의)", full: "on", consult: "off", none: "off" },
  { label: "아티스트 콜라보 지원", full: "on", consult: "on", none: "on" },
];

export const REV_FULL: { label: string; status: BenefitStatus }[] = [
  { label: "COSY.AI 이용", status: "on" },
  { label: "광고/커머스 영업 전담 (RIZZ 독점 영업)", status: "on" },
  { label: "커머스 매칭회의", status: "on" },
  { label: "무제한 브랜드 소싱", status: "on" },
  { label: "무제한 샘플 제공", status: "on" },
  { label: "(요청 시) 세무/회계 대행", status: "on" },
  { label: "법적 리스크 케어", status: "on" },
];

export const REV_PARTIAL: { label: string; status: BenefitStatus }[] = [
  { label: "COSY.AI 이용", status: "on" },
  { label: "광고 (자유롭게 진행 가능)", status: "on" },
  { label: "커머스 (RIZZ 독점 영업)", status: "on" },
  { label: "무제한 브랜드 소싱", status: "on" },
  { label: "무제한 샘플 제공", status: "on" },
  { label: "세무/회계 대행", status: "off" },
  { label: "법적 리스크 상담", status: "limited" },
];
