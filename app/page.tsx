import { Suspense } from "react";
import { CreatorForm } from "@/components/CreatorForm";

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">GLOWUP RIZZ</div>
        <div className="topbar-contact">
          <span>문의</span> <a href="mailto:artist@glowuprizz.com">artist@glowuprizz.com</a>
        </div>
      </header>
      <div className="page">
        <div className="hero">
          <div className="hero-tag">Artist Relationship Guide</div>
          <h1>GLOWUP RIZZ<span className="line2">아티스트 계약 시작하기</span></h1>
          <p className="hero-sub">안녕하세요, 아래 계약 진행 안내를 확인해주세요. <br/> 계약은 1분이면 완료됩니다! 앞으로 잘 부탁드려요 :)</p>
        </div>
        <div className="notice-box">
          <h3><span className="icon-doc">📋</span> 계약 진행 안내</h3>
          <ol className="notice-list">
            <li>질문에 모두 답변해주시면, 원하시는 범위에 맞는 계약 유형이 자동으로 안내됩니다.</li>
            <li>답변은 제출 전 검토 및 수정 가능합니다. 이후 서명을 진행하게 됩니다.</li>
            <li>계약 후 3일 안에 제출해주신 연락처로 온보딩 미팅 연락을 드립니다.</li>
          </ol>
          <div className="notice-process">
            <div className="np-step"><div className="np-num">1</div><div className="np-text">질문 답변</div></div>
            <div className="np-arrow">→</div>
            <div className="np-step"><div className="np-num">2</div><div className="np-text">계약 유형 결정</div></div>
            <div className="np-arrow">→</div>
            <div className="np-step"><div className="np-num">3</div><div className="np-text">계약서 서명</div></div>
            <div className="np-arrow">→</div>
            <div className="np-step"><div className="np-num">4</div><div className="np-text">기본 서류 제출</div></div>
          </div>
        </div>
        <Suspense fallback={<div className="form-card"><p style={{ textAlign: "center", color: "var(--gray-500)" }}>불러오는 중…</p></div>}>
          <CreatorForm />
        </Suspense>
      </div>
      <footer>© GLOWUP RIZZ · contact@glowuprizz.com<br />서울시 성동구 연무장19길 6</footer>
    </>
  );
}
