"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  onSignedChange: (signed: boolean) => void;
  /** 서명 시 PNG data URL (PDF·보관용). 다시 쓰기 시 null */
  onDataUrlChange?: (dataUrl: string | null) => void;
};

export function SignaturePad({ onSignedChange, onDataUrlChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const markedRef = useRef(false);
  const [signed, setSigned] = useState(false);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    const pad = padRef.current;
    if (!canvas || !pad) return;
    const rect = pad.getBoundingClientRect();
    const dpr = 2;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    setup();
    const pad = padRef.current;
    if (!pad || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setup());
    ro.observe(pad);
    return () => ro.disconnect();
  }, [setup]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const emitDataUrl = () => {
      if (!onDataUrlChange) return;
      requestAnimationFrame(() => {
        try {
          onDataUrlChange(canvas.toDataURL("image/png"));
        } catch {
          onDataUrlChange(null);
        }
      });
    };

    const markSigned = () => {
      if (markedRef.current) return;
      markedRef.current = true;
      setSigned(true);
      onSignedChange(true);
      emitDataUrl();
    };

    const onMouseDown = (e: MouseEvent) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      drawingRef.current = true;
      const r = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!drawingRef.current) return;
      const ctx = ctxRef.current;
      if (!ctx) return;
      const r = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
      ctx.stroke();
      markSigned();
    };

    const endStroke = () => {
      drawingRef.current = false;
      if (markedRef.current && onDataUrlChange) {
        requestAnimationFrame(() => {
          try {
            onDataUrlChange(canvas.toDataURL("image/png"));
          } catch {
            onDataUrlChange(null);
          }
        });
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const ctx = ctxRef.current;
      if (!ctx || !e.touches[0]) return;
      drawingRef.current = true;
      const r = canvas.getBoundingClientRect();
      const t = e.touches[0];
      ctx.beginPath();
      ctx.moveTo(t.clientX - r.left, t.clientY - r.top);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!drawingRef.current) return;
      const ctx = ctxRef.current;
      if (!ctx || !e.touches[0]) return;
      const r = canvas.getBoundingClientRect();
      const t = e.touches[0];
      ctx.lineTo(t.clientX - r.left, t.clientY - r.top);
      ctx.stroke();
      markSigned();
    };

    const onTouchEnd = () => {
      drawingRef.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", endStroke);
    canvas.addEventListener("mouseleave", endStroke);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", endStroke);
      canvas.removeEventListener("mouseleave", endStroke);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [setup, onSignedChange, onDataUrlChange]);

  const handleClear = () => {
    markedRef.current = false;
    setSigned(false);
    onSignedChange(false);
    onDataUrlChange?.(null);
    setup();
  };

  return (
    <>
      <div
        ref={padRef}
        className={`sign-pad${signed ? " signed" : ""}`}
      >
        <canvas ref={canvasRef} />
        <div className="sign-pad-placeholder">
          터치 또는 마우스로 서명
        </div>
      </div>
      <div className="sign-actions">
        <button
          type="button"
          className="sign-clear"
          onClick={handleClear}
        >
          다시 쓰기
        </button>
      </div>
    </>
  );
}
