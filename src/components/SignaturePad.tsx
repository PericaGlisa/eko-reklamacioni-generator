import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Pen } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

type Point = { x: number; y: number };

const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Array<Point | null>>([]);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "hsl(215, 45%, 12%)";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    return ctx;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "hsl(215, 45%, 12%)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return { canvas, ctx, width, height };
  }, []);

  const drawGuide = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    // Fill white background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    // Draw signature guide line
    const lineY = rect.height * 0.72;
    ctx.save();
    ctx.strokeStyle = "hsl(150, 12%, 82%)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(rect.width * 0.08, lineY);
    ctx.lineTo(rect.width * 0.92, lineY);
    ctx.stroke();
    // Draw small "x" marker
    ctx.setLineDash([]);
    ctx.fillStyle = "hsl(150, 8%, 68%)";
    ctx.font = "500 14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("✕", rect.width * 0.04, lineY + 5);
    ctx.restore();
  }, []);

  const redrawAll = useCallback(() => {
    const resized = resizeCanvas();
    if (!resized) return;
    const { canvas, ctx } = resized;
    drawGuide(canvas);

    const points = strokesRef.current;
    if (points.length === 0) return;

    ctx.beginPath();
    let hasAny = false;
    let prev: Point | null = null;
    for (const p of points) {
      if (!p) {
        prev = null;
        continue;
      }
      if (!prev) {
        ctx.moveTo(p.x, p.y);
        prev = p;
        hasAny = true;
        continue;
      }
      ctx.lineTo(p.x, p.y);
      prev = p;
    }
    if (hasAny) ctx.stroke();
  }, [drawGuide, resizeCanvas]);

  useEffect(() => {
    redrawAll();
    const target = containerRef.current ?? canvasRef.current;
    if (!target) return;

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        requestAnimationFrame(() => redrawAll());
      });
      ro.observe(target);
      return () => ro.disconnect();
    }

    const onResize = () => redrawAll();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [redrawAll]);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    strokesRef.current.push(null);
    strokesRef.current.push(pos);
    isDrawingRef.current = true;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    strokesRef.current.push(pos);
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      const hasAny = strokesRef.current.some((p) => p !== null);
      setHasSignature(hasAny);
      if (hasAny) {
        onSignatureChange(canvasRef.current?.toDataURL("image/png") || null);
      } else {
        onSignatureChange(null);
      }
    }
    if (e && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const clear = () => {
    strokesRef.current = [];
    redrawAll();
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative rounded-2xl border-2 border-dashed border-input bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsla(152,58%,28%,0.08)]"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-40 cursor-crosshair touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1.5 pb-6">
            <Pen className="h-5 w-5 text-muted-foreground/30" />
            <span className="text-muted-foreground/50 text-xs font-medium tracking-wide">
              Potpišite iznad linije
            </span>
          </div>
        )}
      </div>
      {hasSignature && (
        <Button type="button" variant="outline" size="sm" onClick={clear} className="rounded-xl text-xs font-medium">
          <Eraser className="mr-1.5 h-3.5 w-3.5" /> Obriši potpis
        </Button>
      )}
    </div>
  );
};

export default SignaturePad;
