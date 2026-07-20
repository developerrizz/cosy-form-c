"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowIcon } from "./ArrowIcon";
import { SignaturePad } from "./SignaturePad";
import type { RevenueChoice, ContentChoice } from "@/lib/formConstants";
import {
  REVENUE_CHOICE_LABELS,
  CONTENT_CHOICE_LABELS,
  CONTRACT_TYPE_NAMES,
  CONTRACT_TYPE_CODES,
  CONTRACT_TYPE_DESC,
  PLAN_BENEFITS,
  REV_FULL,
  REV_PARTIAL,
  CONTENT_BENEFITS,
} from "@/lib/formConstants";
import {
  formatContractDateIso,
  getPlanContractPeriod,
  PLAN_KEY_POINTS,
  PLAN_LABEL,
  PLAN_SHORT_DESC,
  PLAN_COMPARE_ROWS,
  type PlanId,
  planHasDedicatedManager,
  planIsExclusive,
} from "@/lib/planConstants";

const SC = 3;

const DEFAULT_AD = "60:40";
const DEFAULT_CH = "70:30";

function scrollTopSmooth() {
  const el = document.querySelector(".form-card");
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

type ContractTab = "summary" | "terms";

function derivePlan(revenue: RevenueChoice | null, content: ContentChoice | null): PlanId | null {
  if (!revenue) return null;
  if (revenue === "partner") return "planC";
  if (!content) return null;
  return content === "none" ? "planA" : "planB";
}

function statusLabel(s: "on" | "limited" | "off" | string): string {
  if (s === "on") return "✓";
  if (s === "limited") return "△";
  if (s === "off") return "✕";
  return s;
}

export function CreatorForm() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [contractMountKey, setContractMountKey] = useState(0);
  const [success, setSuccess] = useState(false);

  const [agree, setAgree] = useState<"yes" | "no" | "">("");
  const [agreeExtras, setAgreeExtras] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [channel, setChannel] = useState("");
  const [channelUrls, setChannelUrls] = useState<{ platform: string; url: string }[]>([{ platform: "youtube", url: "" }]);
  const [notes, setNotes] = useState("");

  const [revenueChoice, setRevenueChoice] = useState<RevenueChoice | null>(null);
  const [contentChoice, setContentChoice] = useState<ContentChoice | null>(null);

  const selectedPlan = useMemo(
    () => derivePlan(revenueChoice, contentChoice),
    [revenueChoice, contentChoice]
  );

  const [adRatio, setAdRatio] = useState(DEFAULT_AD);
  const [chRatio, setChRatio] = useState(DEFAULT_CH);

  const [hasSigned, setHasSigned] = useState(false);
  const [signaturePng, setSignaturePng] = useState<string | null>(null);
  const [agreeESign, setAgreeESign] = useState(false);
  const [contractTab, setContractTab] = useState<ContractTab>("summary");
  const [summaryConfirmed, setSummaryConfirmed] = useState(false);

  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  const [fileId, setFileId] = useState<File | null>(null);
  const [fileBank, setFileBank] = useState<File | null>(null);
  const [filePhoto, setFilePhoto] = useState<File | null>(null);

  const [logs, setLogs] = useState<{ event: string; ts: number; ua: string }[]>([]);

  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  const pushLog = useCallback(
    (event: string) => {
      setLogs((prev) => [...prev, { event, ts: Date.now(), ua: userAgent }]);
    },
    [userAgent]
  );

  useEffect(() => {
    pushLog("form_open");
    const id = searchParams.get("id");
    if (!id) return;
    fetch(`/api/sheet?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d: Record<string, unknown>) => {
        if (d.result !== "success") return;
        if (typeof d.name === "string") setName(d.name);
        if (typeof d.contact === "string") setContact(d.contact);
        if (typeof d.channel === "string") setChannel(d.channel);
        if (typeof d.channelUrl === "string") setChannelUrls([{ platform: "youtube", url: d.channelUrl }]);
        if (typeof d.adRatio === "string") setAdRatio(d.adRatio);
        if (typeof d.chRatio === "string") setChRatio(d.chRatio);
        if (typeof d.email === "string") setEmail(d.email);
      })
      .catch((err) => console.log("설정 조회 실패:", err));
  }, [searchParams, pushLog]);

  const planPeriod = useMemo(() => {
    if (!selectedPlan) return null;
    const p = getPlanContractPeriod();
    return {
      start: p.start,
      end: p.end,
      label: `${formatContractDateIso(p.start)} ~ ${formatContractDateIso(p.end)}`,
    };
  }, [selectedPlan]);

  const validateStep = (s: number): boolean => {
    if (s === 0) {
      return (
        agree === "yes" &&
        name.trim().length > 0 &&
        contact.trim().length > 0 &&
        channel.trim().length > 0 &&
        channelUrls.some((u) => u.url.trim().length > 0)
      );
    }
    if (s === 1) return selectedPlan !== null && agreeExtras;
    return true;
  };

  function goStep(s: number) {
    if (s > currentStep && !validateStep(currentStep)) return;
    if (s === 3) {
      setContractMountKey((k) => k + 1);
      setHasSigned(false);
      setSignaturePng(null);
      setAgreeESign(false);
      setEmailVerified(false);
      setEmailCode("");
      setEmailMsg("");
      setContractTab("summary");
    }
    setCurrentStep(s);
    scrollTopSmooth();
  }

  const [attempted0, setAttempted0] = useState(false);
  const [attempted1, setAttempted1] = useState(false);
  const [attemptedSign, setAttemptedSign] = useState(false);

  const tryGoStep = (s: number) => {
    if (s > currentStep) {
      if (currentStep === 0) setAttempted0(true);
      if (currentStep === 1) setAttempted1(true);
      if (!validateStep(currentStep)) {
        if (currentStep === 1 && !agreeExtras) {
          setTimeout(() => {
            const el = document.querySelector(".field.error");
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top, behavior: "smooth" });
            }
          }, 50);
        }
        return;
      }
      if (currentStep === 0) pushLog("step_basic_completed");
      if (currentStep === 1) pushLog("step_plan_completed");
      if (currentStep === 2) pushLog("step_confirm_completed");
    }
    goStep(s);
  };

  useEffect(() => {
    if (currentStep === 3) pushLog("contract_viewed");
  }, [currentStep, pushLog]);

  const errExtras = attempted0 && !agreeExtras;
  const errAgree = attempted0 && agree !== "yes";
  const errName = attempted0 && !name.trim();
  const errContact = attempted0 && !contact.trim();
  const errChannel = attempted0 && !channel.trim();
  const errUrl = attempted0 && !channelUrls.some((u) => u.url.trim());
  const errPlan = attempted1 && !selectedPlan;

  const progressPct = currentStep < SC ? Math.round(((currentStep + 1) / SC) * 100) : 0;

  const completeSign = () => {
    setAttemptedSign(true);
    if (!emailVerified || !agreeESign || !hasSigned || !agreeExtras) return;
    pushLog("sign_completed");
    setCurrentStep(4);
    scrollTopSmooth();
  };

  const sendEmailCode = async () => {
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setEmailMsg("올바른 이메일 주소를 입력해주세요.");
      return;
    }
    setEmailSending(true);
    setEmailMsg("");
    try {
      const r = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: em }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || d.error) {
        setEmailMsg("인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setEmailMsg("인증번호를 이메일로 보냈습니다.");
      pushLog("email_code_sent");
    } catch {
      setEmailMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmailCode = async () => {
    const em = email.trim();
    const code = emailCode.trim();
    if (!code) {
      setEmailMsg("인증번호를 입력해주세요.");
      return;
    }
    setEmailBusy(true);
    setEmailMsg("");
    try {
      const r = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email: em, code }),
      });
      const d = (await r.json()) as { ok?: boolean; verified?: boolean; error?: string };
      const ok = r.ok && (d.ok === true || d.verified === true);
      if (!ok) {
        setEmailMsg("인증번호가 올바르지 않거나 만료되었습니다.");
        return;
      }
      setEmailVerified(true);
      setEmailMsg("이메일 인증이 완료되었습니다.");
      pushLog("email_verified");
    } catch {
      setEmailMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setEmailBusy(false);
    }
  };

  const finalSubmit = async () => {
    if (!selectedPlan) return;
    const hasAnyDoc = !!(fileId || fileBank || filePhoto);
    pushLog("submit_clicked");
    const payload = {
      name: name.trim(),
      contact: contact.trim(),
      channel: channel.trim(),
      channelUrl: channelUrls.filter((u) => u.url.trim()).map((u) => `[${u.platform}] ${u.url.trim()}`).join(", "),
      email: email.trim(),
      emailVerified,
      revenueChoice,
      contentChoice,
      plan: selectedPlan,
      typeCode: CONTRACT_TYPE_CODES[selectedPlan],
      typeName: CONTRACT_TYPE_NAMES[selectedPlan],
      exclusive: planIsExclusive(selectedPlan),
      adRatio,
      chRatio,
      contractStart: planPeriod?.start ?? null,
      contractEnd: planPeriod?.end ?? null,
      notes: notes.trim(),
      signed: true,
      docsUploaded: hasAnyDoc,
      agreeExtras,
      agreeESign,
      signaturePng: signaturePng ?? null,
      logs,
    };
    try {
      await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Sheet error:", e);
    }
    setSuccess(true);
    scrollTopSmooth();
  };

  const ar = adRatio.split(":");

  const todayStr = useMemo(() => {
    return `2026년 10월 01일`;
  }, []);

  const signBlockedReason = !emailVerified || !agreeESign || !hasSigned || !agreeExtras;

  const revSectionExclusive = planIsExclusive(selectedPlan) && (
    <div className="contract-section">
      <h4>수익 배분</h4>
      <div className="contract-row">
        <span className="cl">애드센스</span>
        <span className="cv">아티스트 독점</span>
      </div>
      <div className="contract-row">
        <span className="cl">광고 수익</span>
        <span className="cv">아티스트 {ar[0]} : RIZZ {ar[1]}</span>
      </div>
      <div className="contract-row">
        <span className="cl">커머스 수익</span>
        <span className="cv">COSY 내 수수료율 적용 (티어별 보너스 有)</span>
      </div>
      <div className="contract-note">
        광고 및 커머스 영업은 RIZZ가 독점으로 진행하며, 아티스트는
        RIZZ를 통하지 않은 별도의 광고/커머스 활동을 할 수 없습니다.
      </div>
    </div>
  );

  const revSectionNonExclusive = !planIsExclusive(selectedPlan) && selectedPlan && (
    <div className="contract-section">
      <h4>수익 배분</h4>
      <div className="contract-row">
        <span className="cl">애드센스</span>
        <span className="cv">아티스트 독점</span>
      </div>
      <div className="contract-row">
        <span className="cl">광고 수익</span>
        <span className="cv">아티스트 자유 활동 가능 / RIZZ 제안 건에 대해서만 RIZZ 6 : 아티스트 4로 나눔</span>
      </div>
      <div className="contract-row">
        <span className="cl">커머스 수익</span>
        <span className="cv">RIZZ 독점 영업 / 건별 협의한 비율로 나눔</span>
      </div>
    </div>
  );

  const commonTermsSection = (
    <div className="contract-section">
      <h4>아티스트 계약 기본 공통 사항</h4>
      <p className="contract-note">
        아래 내용은 계약 유형에 관계 없는 기본 조항으로 서명 시 글로우업리즈 주식회사(이하 &lsquo;회사&rsquo;)와 아티스트{" "}
        {name || "○○○"} 님(이하 &lsquo;파트너&rsquo;)은 아래 조항에 동의한 것으로 간주됩니다.
      </p>
      <ol className="contract-list">
        <li>
          <strong>불가항력</strong>
          <br />
          지진, 화재, 전쟁, 내란, 정부의 규제, 감염병의 확산, 사업의 철수,
          중대한 질병 또는 상해 등 불가피한 사정으로 계약 이행이 어려운 경우
          협의하여 해지·변경할 수 있으며, 그에 따른 손해배상은 청구하지 않습니다.
        </li>
        <li>
          <strong>계약의 해지</strong>
          <br />
          상호 협의로 언제든 해지할 수 있고, 일방 위반 시 상대방은 14일 내 시정을
          요구한 뒤 미이행이면 서면 통지로 해지할 수 있습니다.
        </li>
        <li>
          <strong>손해배상 및 위약벌</strong>
          <br />
          일방의 귀책으로 상대방에게 손해가 발생한 경우 손해배상을 청구할 수
          있습니다. 파트너의 위반으로 회사의 제3자 계약이 불이행된 경우·독자
          광고 계약 등에 대해서는 별도로 정한 위약벌 조항이 적용될 수
          있습니다.
        </li>
        <li>
          <strong>비밀유지</strong>
          <br />
          계약 과정에서 알게 된 영업·기술·업무상 비밀을 무단 공개·오용하지
          않으며, 계약 종료 후에도 의무가 지속됩니다.
        </li>
        <li>
          <strong>권리의 양도 등</strong>
          <br />
          상대방 사전 서면 동의 없이 계약상 권리·의무를 제3자에게 양도·담보
          제공·승계시킬 수 없습니다.
        </li>
        <li>
          <strong>분쟁 해결</strong>
          <br />
          분쟁은 성실히 협의하고, 소송 시 제1심 관할은 서울중앙지방법원으로
          합니다.
        </li>
      </ol>
    </div>
  );

  const planCompareTable = (
    <div className="plan-compare-wrap">
      <div className="plan-compare-intro">
        아래는 선택하신 유형과 다른 유형을 비교한 표입니다.
      </div>
      <div className="plan-compare-table-scroll">
        <table className="plan-compare-table">
          <thead>
            <tr>
              <th className="pct-label">항목</th>
              <th className={`pct-col${selectedPlan === "planA" ? " pct-selected" : ""}`}>
                A. 제한적 파트너십
                {selectedPlan === "planA" && <span className="pct-badge">선택됨</span>}
              </th>
              <th className={`pct-col pct-recommend${selectedPlan === "planB" ? " pct-selected" : ""}`}>
                B. 파트너십 ★
                {selectedPlan === "planB" && <span className="pct-badge">선택됨</span>}
              </th>
              <th className={`pct-col${selectedPlan === "planC" ? " pct-selected" : ""}`}>
                C. 전속
                {selectedPlan === "planC" && <span className="pct-badge">선택됨</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const groups: Record<string, typeof PLAN_COMPARE_ROWS> = {};
              for (const row of PLAN_COMPARE_ROWS) {
                if (!groups[row.group]) groups[row.group] = [];
                groups[row.group].push(row);
              }
              return Object.entries(groups).flatMap(([group, rows], gi) => [
                <tr key={`g-${gi}`} className="pct-group-row">
                  <td colSpan={4}>{group}</td>
                </tr>,
                ...rows.map((row) => (
                  <tr key={row.label}>
                    <td className="pct-label-cell">{row.label}</td>
                    {(["planA", "planB", "planC"] as PlanId[]).map((pid) => {
                      const val = row[pid];
                      const isSelected = selectedPlan === pid;
                      const isStatus = val === "on" || val === "off" || val === "limited";
                      return (
                        <td
                          key={pid}
                          className={`pct-val ${isStatus ? val : "text"} ${isSelected ? "pct-selected-col" : ""} ${pid === "planB" ? "pct-recommend-col" : ""}`}
                        >
                          {isStatus ? statusLabel(val) : val}
                        </td>
                      );
                    })}
                  </tr>
                )),
              ]);
            })()}
          </tbody>
        </table>
      </div>
      <div className="plan-compare-legend">
        <span><span className="legend-on">✓</span> 포함</span>
        <span><span className="legend-limited">△</span> 제한적 포함</span>
        <span><span className="legend-off">✕</span> 미포함</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="form-card" style={{ display: success ? "none" : "block" }}>
        <div
          className="progress-wrap"
          style={{ display: currentStep < SC ? "block" : "none" }}
        >
          <div className="progress-info">
            <span>{currentStep + 1} / {SC}단계</span>
            <span>{progressPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* ========== STEP 1: 기본 정보 ========== */}
        <div className={`step-panel${currentStep === 0 ? " active" : ""}`}>
          <div className="sec-tag">Step 01</div>
          <div className="sec-title">기본 정보</div>
          <div className="sec-desc">아티스트 본인의 정보를 입력해주세요.</div>
          <div className={`field${errAgree ? " error" : ""}`}>
            <div className="field-label">
              개인 정보 활용 동의 <span className="req">*</span>
            </div>
            <div className="consent-box">
              아래 질문지에서 응답하신 내용은 계약 외의 목적으로 활용되지
              않습니다.<br />동의하지 않으실 수 있지만, 계약 진행은 제한됩니다.
            </div>
            <div className="opts">
              <label className={`opt${agree === "yes" ? " sel" : ""}`}>
                <input type="radio" name="agree" value="yes" checked={agree === "yes"} onChange={() => { setAgree("yes"); pushLog("agree_privacy"); }} />
                <div className="opt-text">동의합니다.</div>
              </label>
              <label className={`opt${agree === "no" ? " sel" : ""}`}>
                <input type="radio" name="agree" value="no" checked={agree === "no"} onChange={() => setAgree("no")} />
                <div className="opt-text">동의하지 않습니다.</div>
              </label>
            </div>
            <div className="field-err">개인 정보 활용에 동의하셔야 진행이 가능합니다.</div>
          </div>
          <div className="divider" />
          <div className={`field${errName ? " error" : ""}`}>
            <label className="field-label" htmlFor="name">이름 (본명) <span className="req">*</span></label>
            <input id="name" type="text" autoComplete="name" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="field-hint">계약서에 기재될 이름입니다.</div>
            <div className="field-err">이름을 입력해주세요.</div>
          </div>
          <div className={`field${errContact ? " error" : ""}`}>
            <label className="field-label" htmlFor="contact">연락처 <span className="req">*</span></label>
            <input id="contact" type="tel" autoComplete="tel" placeholder="010-0000-0000" value={contact} onChange={(e) => setContact(e.target.value)} />
            <div className="field-err">연락처를 입력해주세요.</div>
          </div>
          <div className={`field${errChannel ? " error" : ""}`}>
            <label className="field-label" htmlFor="channel">대표 채널명 <span className="req">*</span></label>
            <input id="channel" type="text" placeholder="유튜브, 인스타그램 등 대표 채널명" value={channel} onChange={(e) => setChannel(e.target.value)} />
            <div className="field-err">대표 채널명을 입력해주세요.</div>
          </div>
          <div className={`field${errUrl ? " error" : ""}`}>
            <label className="field-label">채널 URL <span className="req">*</span></label>
            <div className="field-hint" style={{ marginBottom: 8 }}>모든 SNS 채널을 다 넣어야 합니다.</div>
            {channelUrls.map((item, idx) => {
              const placeholderMap: Record<string, string> = {
                youtube: "https://youtube.com/@채널명",
                instagram: "https://instagram.com/아이디",
                tiktok: "https://tiktok.com/@아이디",
                x: "https://x.com/아이디",
                facebook: "https://facebook.com/아이디",
                threads: "https://threads.net/@아이디",
                blog: "https://blog.naver.com/아이디",
                other: "https://",
              };
              return (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                  <select
                    value={item.platform}
                    onChange={(e) => {
                      const next = [...channelUrls];
                      next[idx] = { ...next[idx], platform: e.target.value };
                      setChannelUrls(next);
                    }}
                    style={{ flexShrink: 0, width: "110px", height: "40px", borderRadius: "6px", border: "1px solid var(--gray-300)", padding: "0 8px", fontSize: "0.85rem", background: "white" }}
                  >
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="x">X (Twitter)</option>
                    <option value="facebook">Facebook</option>
                    <option value="threads">Threads</option>
                    <option value="blog">블로그</option>
                    <option value="other">기타</option>
                  </select>
                  <input
                    type="url"
                    placeholder={placeholderMap[item.platform] ?? "https://"}
                    value={item.url}
                    onChange={(e) => {
                      const next = [...channelUrls];
                      next[idx] = { ...next[idx], url: e.target.value };
                      setChannelUrls(next);
                    }}
                    style={{ flex: 1 }}
                  />
                  {channelUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setChannelUrls(channelUrls.filter((_, i) => i !== idx))}
                      style={{ padding: "0 10px", height: "40px", background: "none", border: "1px solid var(--gray-300)", borderRadius: "6px", cursor: "pointer", color: "#999", fontSize: "1rem", flexShrink: 0 }}
                      aria-label="삭제"
                    >✕</button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setChannelUrls([...channelUrls, { platform: "youtube", url: "" }])}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1px dashed var(--gray-300)", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem", color: "#6B4EFF", marginTop: "2px" }}
            >+ 채널 추가</button>
            <div className="field-err">채널 URL을 입력해주세요.</div>
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-next" onClick={() => tryGoStep(1)}>
              다음 단계 <ArrowIcon />
            </button>
          </div>
        </div>

        {/* ========== STEP 2: 계약 유형 ========== */}
        <div className={`step-panel${currentStep === 1 ? " active" : ""}`}>
          <div className="base-service">
            <h3>기본 제공 서비스 <span>— 유형에 따라 일부 항목은 적용 범위가 달라질 수 있습니다</span></h3>
            <div className="bs-grid">
              {["담당 매니저 배정 (유형별)", "COSY.AI 이용", "RIZZ 1, 2사옥 라운지 이용", "촬영 공간 제공", "아티스트 네트워킹 행사 참여", "채널 이슈 확인 및 논의"].map((t) => (
                <div key={t} className="bs-item"><span className="bs-dot" />{t === "담당 매니저 배정 (유형별)" ? <strong>{t}</strong> : t}</div>
              ))}
            </div>
          </div>
          <div className="divider" />
          <div className={`field${errExtras ? " error" : ""}`}>
            <div className="field-label">
              RIZZ와 계약 시 아래 사항을 필수로 진행하고 있습니다. <span className="req">*</span>
            </div>
            <div className="consent-box">
              <ol className="notice-list">
                <li>RIZZ 홈페이지에 아티스트로 등록됩니다.</li>
                <li>RIZZ 인스타그램(@_rizz_official)에 아티스트로 소개됩니다.</li>
                <li>RIZZ 인스타그램에 올라간 소개 게시물을 공동작업자로 설정, 최상단 고정해주셔야 합니다.</li>
                <li>아티스트 분의 인스타그램 소개란에 @_rizz_official 을 추가 해주셔야 합니다.</li>
                <li>네이버 검색 프로필에 RIZZ가 소속사로 추가되며, RIZZ 소속사 인물 리스트에 등록됩니다.</li>
                <li><strong>hotdogtv.kd@gmail.com</strong> 을 유튜브 관리자 계정으로 초대해주셔야 합니다.</li>
              </ol>
            </div>
            <label className="opt">
              <input
                type="checkbox"
                checked={agreeExtras}
                onChange={(e) => {
                  const v = e.target.checked;
                  setAgreeExtras(v);
                  if (v) pushLog("agree_extras");
                }}
              />
              <div className="opt-text">위 6가지 필수 사항에 모두 동의합니다.</div>
            </label>
            <div className="field-err">위 필수 사항에 동의하셔야 계약을 진행할 수 있습니다.</div>
          </div>
          <div className="sec-tag">Step 02</div>
          <div className="sec-title">희망 계약 유형</div>
          <div className="sec-desc">두 가지 질문에 답하면 맞는 유형이 자동으로 안내됩니다.</div>

          <div className="plan-question-block">
            <div className="plan-question-num">Q1</div>
            <div className="plan-question-text">광고·커머스 등 수익활동에 대해 RIZZ의 도움이 어느 정도 필요하신가요?</div>
            <div className="opts">
              {(["free", "partner"] as RevenueChoice[]).map((val) => (
                <label key={val} className={`opt${revenueChoice === val ? " sel" : ""}`}>
                  <input
                    type="radio"
                    name="revenue"
                    checked={revenueChoice === val}
                    onChange={() => {
                      setRevenueChoice(val);
                      if (val === "partner") setContentChoice("full");
                      else setContentChoice(null);
                      pushLog(`revenue_choice_${val}`);
                    }}
                  />
                  <div>
                    <div className="opt-text">{REVENUE_CHOICE_LABELS[val].label}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>{REVENUE_CHOICE_LABELS[val].desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {revenueChoice !== null && (
              <div style={{ marginTop: "16px", padding: "16px", background: "#F7F6FF", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B4EFF", marginBottom: "10px" }}>수익활동 관련 혜택</div>
                {(revenueChoice === "partner" ? REV_FULL : REV_PARTIAL).map((item) => (
                  <div key={item.label} className={`rs-item ${item.status}`} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", marginBottom: "6px", ...(item.status === "off" ? { textDecoration: "line-through", color: "#bbb" } : {}) }}>
                    <span className={`rs-dot ${item.status}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {revenueChoice !== null && (
            <div className="plan-question-block">
              <div className="plan-question-num">Q2</div>
              <div className="plan-question-text">채널 운영과 콘텐츠 기획/제작에 RIZZ의 도움이 필요하신가요?</div>
              <div className="opts">
                {(revenueChoice === "partner" ? (["full"] as ContentChoice[]) : (["consult", "none"] as ContentChoice[])).map((val) => (
                  <label key={val} className={`opt${contentChoice === val ? " sel" : ""}`}>
                    <input
                      type="radio"
                      name="content"
                      checked={contentChoice === val}
                      onChange={() => { setContentChoice(val); pushLog(`content_choice_${val}`); }}
                    />
                    <div>
                      <div className="opt-text">{CONTENT_CHOICE_LABELS[val].label}</div>
                      <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>{CONTENT_CHOICE_LABELS[val].desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {contentChoice !== null && (
                <div style={{ marginTop: "16px", padding: "16px", background: "#F7F6FF", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B4EFF", marginBottom: "10px" }}>채널/콘텐츠 관련 혜택</div>
                  {CONTENT_BENEFITS.map((item) => {
                    const status = item[contentChoice as keyof typeof item] as string;
                    return (
                      <div key={item.label} className={`rs-item ${status}`} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", marginBottom: "6px", ...(status === "off" ? { textDecoration: "line-through", color: "#bbb" } : {}) }}>
                        <span className={`rs-dot ${status}`} />
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {errPlan && (
            <div className="field-err" style={{ display: "block", marginTop: 8 }}>
              질문에 모두 답해 유형을 선택해주세요.
            </div>
          )}

          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => goStep(0)}>← 이전</button>
            <button type="button" className="btn btn-next" onClick={() => tryGoStep(2)}>다음 단계 <ArrowIcon /></button>
          </div>
        </div>

        {/* ========== STEP 3: 확인 ========== */}
        <div className={`step-panel${currentStep === 2 ? " active" : ""}`}>
          <div className="sec-tag">Step 03</div>
          <div className="sec-title">입력 내용 확인</div>
          <div className="sec-desc">아래 내용이 맞는지 확인해보시고, 수정이 필요하시면 해당 항목을 클릭하세요.</div>
          {selectedPlan && (
            <>
              <div className="hero-confirm-card">
                <div className="hero-confirm-badge">{PLAN_LABEL[selectedPlan]}</div>
                <div className="hero-confirm-name">{CONTRACT_TYPE_NAMES[selectedPlan]} ({CONTRACT_TYPE_CODES[selectedPlan]})</div>
                <div className="hero-confirm-desc">{CONTRACT_TYPE_DESC[selectedPlan]}</div>
                <div className="hero-confirm-divider" />
                <div className="hero-confirm-info">
                  <strong>{name}</strong> · {contact}<br />
                  <strong>{channel}</strong>
                </div>
                <div className="hero-confirm-btns">
                  <button type="button" className="hero-confirm-btn" onClick={() => goStep(0)}>← 기본정보 수정</button>
                  {selectedPlan !== "planB" && (
                    <button type="button" className="hero-confirm-btn" onClick={() => goStep(1)}>유형 변경 →</button>
                  )}
                </div>
              </div>
              <div className="divider" />
              <div className="sec-subtitle">전체 유형 비교</div>
              {planCompareTable}
              {selectedPlan !== "planB" ? (
                <div className="plan-nudge-banner">
                  <div className="plan-nudge-text"><strong>★파트너십(B)</strong>은 전담 매니저와 컨설팅 지원을 받으면서도 광고 수익활동은 자유롭게 진행할 수 있어요.</div>
                  <button type="button" className="plan-nudge-btn" onClick={() => { setRevenueChoice("free"); setContentChoice("consult"); goStep(1); }}>파트너십으로 변경 →</button>
                  <div className="plan-nudge-sub">변경해도 지금까지 입력한 정보는 유지됩니다.</div>
                </div>
              ) : (
                <div className="plan-confirm-banner">
                  <div className="plan-confirm-top">
                    <div className="plan-confirm-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 6l3 3 5-5" /></svg>
                    </div>
                    <div className="plan-confirm-title">균형잡힌 선택이에요</div>
                  </div>
                  <div className="plan-confirm-desc"><strong>★파트너십(B)</strong>은 전담 매니저와 컨설팅 지원을 받으면서도 광고 수익활동은 자유롭게 진행할 수 있어요.</div>
                </div>
              )}
            </>
          )}
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => goStep(1)}>← 이전</button>
            <button type="button" className="btn btn-submit" onClick={() => tryGoStep(3)}>확인 완료, 계약서 확인 <ArrowIcon /></button>
          </div>
        </div>

        {/* ========== STEP 4: 계약서 & 서명 ========== */}
        <div className={`step-panel${currentStep === 3 ? " active" : ""}`}>
          <div className="sec-tag">계약서</div>
          <div className="sec-title">계약서 확인 및 서명</div>
          <div className="sec-desc">이메일 인증 후 탭에서 계약 내용을 확인하고 서명해주세요.</div>

          <div className="email-verify-section">
            <h4>본인 인증</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: "4px", marginBottom: "16px" }}>
              반드시 계약 당사자 본인 명의의 이메일이어야 합니다.
            </p>
            <div className="field">
              <label className="field-label" htmlFor="verify-email">이메일</label>
              <input id="verify-email" type="email" autoComplete="email" placeholder="name@example.com" value={email} disabled={emailVerified} onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); }} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="verify-code">인증번호</label>
              <input id="verify-code" type="text" inputMode="numeric" maxLength={8} placeholder="6자리" value={emailCode} disabled={emailVerified} onChange={(e) => setEmailCode(e.target.value)} />
            </div>
            <div className="email-verify-actions">
              <button type="button" className="btn btn-ghost" disabled={emailSending || emailVerified} onClick={() => void sendEmailCode()}>
                {emailSending ? "발송 중…" : "인증번호 받기"}
              </button>
              <button type="button" className="btn btn-next" disabled={emailBusy || emailVerified} onClick={() => void verifyEmailCode()}>
                {emailBusy ? "확인 중…" : "인증 확인"}
              </button>
            </div>
            {emailMsg && <p className="field-hint" style={{ marginTop: 12 }}>{emailMsg}</p>}
            {emailVerified && (
              <p className="field-hint" style={{ marginTop: 12, color: "var(--green)", fontWeight: 600 }}>
                인증이 완료되었습니다. 탭에서 계약서를 확인한 뒤 서명해주세요.
              </p>
            )}
          </div>

          <div className="contract-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={contractTab === "summary"} className={`contract-tab${contractTab === "summary" ? " active" : ""}`} onClick={() => { setContractTab("summary"); pushLog("contract_tab_summary"); }}>
              계약 내용
            </button>
            <button type="button" role="tab" aria-selected={contractTab === "terms"} className={`contract-tab${contractTab === "terms" ? " active" : ""}`} onClick={() => { setContractTab("terms"); pushLog("contract_tab_terms"); }}>
              계약 조항·서명
            </button>
          </div>

          {selectedPlan && (
            <div className="contract-wrap" key={contractMountKey}>
              {contractTab === "summary" ? (
                <div className="contract-body">
                  <div className="contract-section">
                    <h4>선택하신 계약 유형 요약</h4>
                    <p className="contract-note">{PLAN_LABEL[selectedPlan]}</p>
                    {planPeriod && (
                      <p className="contract-note" style={{ marginTop: 10 }}>
                        <strong>계약 기간</strong> {planPeriod.label}
                      </p>
                    )}
                    <ul className="contract-summary-bullets" style={{ marginTop: "16px" }}>
                      {PLAN_KEY_POINTS[selectedPlan].map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="contract-section">
                    <h4>혜택 요약</h4>
                    {PLAN_BENEFITS[selectedPlan].map((item) => (
                      <div key={item.label} className={`rs-item ${item.status}`} style={item.status === "off" ? { textDecoration: "line-through", color: "#bbb" } : {}}>
                        <span className={`rs-dot ${item.status}`} />
                        {item.label === "전담 매니저 배정" ? <strong>{item.label}</strong> : item.label}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--gray-200)" }}>
                    <label className="opt">
                      <input
                        type="checkbox"
                        checked={summaryConfirmed}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSummaryConfirmed(true);
                            setContractTab("terms");
                            pushLog("contract_summary_confirmed");
                            setTimeout(() => {
                              const el = document.querySelector(".contract-tabs");
                              if (el) {
                                const top = el.getBoundingClientRect().top + window.scrollY - 80;
                                window.scrollTo({ top, behavior: "smooth" });
                              }
                            }, 50);
                          }
                        }}
                      />
                      <div className="opt-text">계약 내용을 확인했습니다. 서명하러 가기 →</div>
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="contract-header">
                    <h2>GLOWUP RIZZ INC. 아티스트 계약서</h2>
                    <p>{CONTRACT_TYPE_NAMES[selectedPlan]} ({CONTRACT_TYPE_CODES[selectedPlan]}) · {todayStr}</p>
                  </div>
                  <div className="contract-body">
                    <div className="contract-section">
                      <h4>계약 당사자</h4>
                      <div className="contract-row">
                        <span className="cl">아티스트</span>
                        <span className="cv">{name} ({channel})</span>
                      </div>
                      <div className="contract-row">
                        <span className="cl">매니지먼트사</span>
                        <span className="cv">글로우업리즈 주식회사 (RIZZ)</span>
                      </div>
                      {planPeriod && (
                        <div className="contract-row">
                          <span className="cl">계약 기간</span>
                          <span className="cv">{planPeriod.label}</span>
                        </div>
                      )}
                    </div>
                    <div className="contract-section">
                      <h4>계약 범위</h4>
                      <div className="contract-row">
                        <span className="cl">계약 유형</span>
                        <span className="cv">{PLAN_LABEL[selectedPlan]}</span>
                      </div>
                      <div className="contract-row">
                        <span className="cl">수익활동</span>
                        <span className="cv">{planIsExclusive(selectedPlan) ? "RIZZ 전담 (독점)" : "광고 자유 · 커머스 RIZZ 독점"}</span>
                      </div>
                      <div className="contract-row">
                        <span className="cl">전담 매니저</span>
                        <span className="cv">{planHasDedicatedManager(selectedPlan) ? "포함" : "미포함"}</span>
                      </div>
                      <div className="contract-row">
                        <span className="cl">채널 소유권</span>
                        <span className="cv">아티스트 귀속</span>
                      </div>
                    </div>
                    {revSectionExclusive}
                    {revSectionNonExclusive}
                    {commonTermsSection}
                    <div className="contract-section">
                      <h4>기본 제공 서비스</h4>
                      <div className="contract-row">
                        <span className="cl"><strong>전담 매니저 배정</strong></span>
                        <span className="cv">{planHasDedicatedManager(selectedPlan) ? "포함" : "해당 유형에서는 미포함"}</span>
                      </div>
                      <div className="contract-row">
                        <span className="cl">COSY 수익화</span>
                        <span className="cv">포함</span>
                      </div>
                      <div className="contract-row">
                        <span className="cl">RIZZ 1, 2사옥 라운지/촬영 공간</span>
                        <span className="cv">포함</span>
                      </div>
                      <div className="contract-row">
                        <span className="cl">아티스트 네트워킹 행사</span>
                        <span className="cv">포함</span>
                      </div>
                    </div>
                  </div>
                  <div className="sign-area">
                    <div className="sign-label">아래에 서명해주세요</div>
                    {!emailVerified && (
                      <p className="field-hint" style={{ marginBottom: 12 }}>
                        이메일 인증을 완료한 뒤 서명할 수 있습니다.
                      </p>
                    )}
                    {attemptedSign && !emailVerified && (
                      <div className="field-err" style={{ display: "block", marginBottom: 12 }}>⚠ 이메일 인증을 먼저 완료해주세요.</div>
                    )}
                    <div style={{ opacity: emailVerified ? 1 : 0.45, pointerEvents: emailVerified ? "auto" : "none" }}>
                      <SignaturePad onSignedChange={setHasSigned} onDataUrlChange={setSignaturePng} />
                    </div>
                    <div className="field" style={{ marginTop: 16 }}>
                      <label className="field-label">
                        전자서명 방식 동의 <span className="req">*</span>
                      </label>
                      <label className="opt">
                        <input
                          type="checkbox"
                          checked={agreeESign}
                          disabled={!emailVerified}
                          onChange={(e) => { const v = e.target.checked; setAgreeESign(v); if (v) pushLog("agree_esign"); }}
                        />
                        <div className="opt-text">본인은 전자서명법 제3조에 따라 전자서명 방식에 동의합니다.</div>
                      </label>
                      {attemptedSign && !agreeESign && emailVerified && (
                        <div className="field-err" style={{ display: "block" }}>전자서명 동의에 체크해주세요.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => goStep(2)}>← 이전</button>
            <button type="button" className="btn btn-submit" onClick={completeSign}>
              서명 완료 <ArrowIcon />
            </button>
          </div>
          {attemptedSign && signBlockedReason && (
            <p className="field-hint" style={{ textAlign: "right" }}>
              {!emailVerified ? "이메일 인증을 먼저 완료해주세요." : "전자서명 동의 및 서명을 완료해주세요."}
            </p>
          )}
        </div>

        {/* ========== STEP 5: 서류 제출 ========== */}
        <div className={`step-panel${currentStep === 4 ? " active" : ""}`}>
          <div className="sec-tag">마지막 단계</div>
          <div className="sec-title">기본 서류 제출</div>
          <div className="sec-desc">아래 서류는 담당 매니저를 통해 나중에 제출하셔도 됩니다.</div>
          <div className="upload-hint-banner">지금 제출하시면 온보딩이 더 빠르게 진행됩니다!</div>
          <div className="upload-field">
            <label htmlFor="file-id">사업자등록증 또는 주민등록증 (선택)</label>
            <div className={`upload-box${fileId ? " done" : ""}`} onClick={() => document.getElementById("file-id")?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.getElementById("file-id")?.click(); } }} role="presentation">
              <input id="file-id" type="file" accept="image/*,.pdf" onChange={(e) => setFileId(e.target.files?.[0] ?? null)} />
              <p>{fileId ? `✓ ${fileId.name}` : "클릭하여 파일을 선택해주세요"}</p>
            </div>
          </div>
          <div className="upload-field">
            <label htmlFor="file-bank">통장사본 (선택)</label>
            <div className={`upload-box${fileBank ? " done" : ""}`} onClick={() => document.getElementById("file-bank")?.click()} role="presentation">
              <input id="file-bank" type="file" accept="image/*,.pdf" onChange={(e) => setFileBank(e.target.files?.[0] ?? null)} />
              <p>{fileBank ? `✓ ${fileBank.name}` : "클릭하여 파일을 선택해주세요"}</p>
            </div>
          </div>
          <div className="upload-field">
            <label htmlFor="file-photo">프로필 사진 (선택)</label>
            <div className={`upload-box${filePhoto ? " done" : ""}`} onClick={() => document.getElementById("file-photo")?.click()} role="presentation">
              <input id="file-photo" type="file" accept="image/*" onChange={(e) => setFilePhoto(e.target.files?.[0] ?? null)} />
              <p>{filePhoto ? `✓ ${filePhoto.name}` : "클릭하여 파일을 선택해주세요"}</p>
            </div>
          </div>
          <div className="divider" />
          <div className="field">
            <label className="field-label" htmlFor="notes">추가 요청사항 (선택)</label>
            <textarea id="notes" placeholder="미팅에서 논의한 내용 중 추가로 전달하고 싶은 사항이 있으면 적어주세요." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-submit" onClick={finalSubmit}>
              완료 <ArrowIcon />
            </button>
          </div>
        </div>
      </div>

      <div className={`success-screen${success ? " show" : ""}`}>
        <div className="success-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 14l7 7 11-12" />
          </svg>
        </div>
        <div className="success-title">계약이 완료되었습니다</div>
        <p className="success-desc">
          제출해주신 서류를 확인한 후, 3일 내에 온보딩 미팅 연락을 드리겠습니다.
          <br />
          추가 문의는 artist@glowuprizz.com 으로 연락해주세요.
        </p>
      </div>
    </>
  );
}
