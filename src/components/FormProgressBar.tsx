import React from "react";
import { CheckCircle2 } from "lucide-react";

interface FormProgressBarProps {
  progress: number;
}

const FormProgressBar: React.FC<FormProgressBarProps> = ({ progress }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-2xl mx-auto px-5 py-2.5 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${clamped}%`,
              background: clamped === 100
                ? "hsl(152, 58%, 38%)"
                : "linear-gradient(90deg, hsl(152, 58%, 28%), hsl(152, 45%, 42%))",
            }}
          />
        </div>
        <div className="flex items-center gap-1.5 min-w-[4.5rem] justify-end">
          {clamped === 100 && (
            <CheckCircle2 className="h-4 w-4 text-primary animate-scale-in" />
          )}
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
            {clamped}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default FormProgressBar;
