import React from "react";
import { Building2, Cpu, ClipboardList, PenLine, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepInfo {
  key: string;
  label: string;
  icon: React.ElementType;
  fields: string[];
}

const STEPS: StepInfo[] = [
  { key: "customer", label: "Podaci o kupcu", icon: Building2, fields: ["nazivKupca", "adresa", "kontaktOsoba", "telefon", "email"] },
  { key: "device", label: "Podaci o uređaju", icon: Cpu, fields: ["modelUredjaja", "serijskiBroj", "tipFluida", "tipSistema"] },
  { key: "complaint", label: "Reklamacija", icon: ClipboardList, fields: ["opisReklamacije"] },
  { key: "final", label: "Završni podaci", icon: PenLine, fields: [] },
];

interface FormStepperProps {
  fieldValidity: Record<string, boolean>;
  activeStep: number;
  onStepClick: (index: number) => void;
}

const FormStepper: React.FC<FormStepperProps> = ({ fieldValidity, activeStep, onStepClick }) => {
  const getStepProgress = (step: StepInfo) => {
    if (step.fields.length === 0) return 1; // final step has no required fields
    const filled = step.fields.filter((f) => fieldValidity[f]).length;
    return filled / step.fields.length;
  };

  return (
    <nav className="hidden lg:flex flex-col gap-0 py-6 pr-2">
      {STEPS.map((step, i) => {
        const progress = getStepProgress(step);
        const isComplete = progress === 1;
        const isActive = activeStep === i;
        const Icon = step.icon;

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onStepClick(i)}
            className="group flex items-start gap-3 text-left focus:outline-none"
          >
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl border-2 transition-all duration-300",
                  isComplete
                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                    : isActive
                      ? "border-primary bg-accent text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground group-hover:border-primary/40"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4.5 w-4.5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div className="relative w-0.5 h-10 bg-border/60 my-1 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 w-full bg-primary transition-all duration-500 rounded-full"
                    style={{ height: `${progress * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Label */}
            <div className="pt-1.5">
              <span
                className={cn(
                  "text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors duration-200",
                  isComplete
                    ? "text-primary"
                    : isActive
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground/70"
                )}
              >
                Korak {i + 1}
              </span>
              <p
                className={cn(
                  "text-sm font-semibold leading-tight mt-0.5 transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
                )}
              >
                {step.label}
              </p>
              {step.fields.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground font-medium">
                    {step.fields.filter((f) => fieldValidity[f]).length}/{step.fields.length}
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default FormStepper;
