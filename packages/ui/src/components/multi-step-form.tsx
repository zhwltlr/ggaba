"use client";

import * as React from "react";
import { cn } from "@ggaba/lib/utils";

export interface StepConfig {
  title: string;
  description?: string;
}

export interface MultiStepFormProps {
  steps: StepConfig[];
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

export function MultiStepForm({
  steps,
  currentStep,
  children,
  className,
}: MultiStepFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  index === currentStep
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Header */}
      <div>
        <h2 className="text-lg font-semibold">{steps[currentStep].title}</h2>
        {steps[currentStep].description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {steps[currentStep].description}
          </p>
        )}
      </div>

      {/* Step Content */}
      <div>{children}</div>
    </div>
  );
}

export interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  submitLabel?: string;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  isNextDisabled = false,
  isSubmitting = false,
  nextLabel = "다음",
  prevLabel = "이전",
  submitLabel = "완료",
}: StepNavigationProps) {
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="flex gap-3">
      {currentStep > 0 && (
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          {prevLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled || isSubmitting}
        className={cn(
          "flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50",
          currentStep === 0 && "w-full"
        )}
      >
        {isSubmitting ? "처리 중..." : isLast ? submitLabel : nextLabel}
      </button>
    </div>
  );
}
