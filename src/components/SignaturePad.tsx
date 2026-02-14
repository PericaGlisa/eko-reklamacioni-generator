import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Pen } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(2, 2);
    }
    drawGuide(canvas);
  }, [drawGuide]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setHasSignature(true);
      onSignatureChange(canvasRef.current?.toDataURL("image/png") || null);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGuide(canvas);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border-2 border-dashed border-input bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsla(152,58%,28%,0.08)]">
        <canvas
          ref={canvasRef}
          className="w-full h-40 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
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
