import React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidatedFormFieldProps {
  isValid: boolean;
  children: React.ReactNode;
  className?: string;
}

const ValidatedFormField: React.FC<ValidatedFormFieldProps> = ({
  isValid,
  children,
  className,
}) => {
  return (
    <div className={cn("relative group", className)}>
      {children}
      {isValid && (
        <div className="absolute right-3 top-[2.15rem] animate-scale-in">
          <CheckCircle2 className="h-4 w-4 text-primary drop-shadow-sm" />
        </div>
      )}
    </div>
  );
};

export default ValidatedFormField;
