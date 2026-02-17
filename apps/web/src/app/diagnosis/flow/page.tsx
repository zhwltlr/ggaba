"use client";

import { useCallback, useMemo } from "react";
import { MultiStepForm, StepNavigation } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { useDiagnosisStore, DIAGNOSIS_STEPS } from "@/stores/use-diagnosis-store";
import { StepUpload } from "./_steps/step-upload";
import { StepMasking } from "./_steps/step-masking";
import { StepInfo } from "./_steps/step-info";
import { StepVerify } from "./_steps/step-verify";
import { StepResult } from "./_steps/step-result";

const STEP_CONFIGS = [
  { title: "업로드", description: "견적서 사진을 업로드해주세요" },
  { title: "마스킹", description: "개인정보를 마스킹 처리합니다" },
  { title: "추가 정보", description: "지역, 건물유형, 평수를 입력해주세요" },
  { title: "항목 확인", description: "추출된 항목을 확인하고 수정하세요" },
  { title: "진단 결과", description: "분석 결과를 확인하세요" },
];

export default function DiagnosisFlowPage() {
  const { currentStep, nextStep, prevStep, uploadedImages, userInput, extractedData } =
    useDiagnosisStore();
  const { toast } = useToast();

  // 스텝별 유효성 검사
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // 업로드 — 이미지 최소 1장
        return uploadedImages.length > 0;
      case 1: // 마스킹 — 항상 가능 (선택 사항)
        return true;
      case 2: // 추가 정보 — 필수 필드 체크
        return !!(userInput.region && userInput.buildingType && userInput.sizePyeong);
      case 3: // 항목 확인 — 항목 최소 1개
        return extractedData.length > 0;
      default:
        return true;
    }
  }, [currentStep, uploadedImages.length, userInput, extractedData.length]);

  const handleNext = useCallback(() => {
    if (!canProceed) {
      const messages: Record<number, string> = {
        0: "견적서 이미지를 최소 1장 업로드해주세요.",
        2: "지역, 건물유형, 평수를 모두 입력해주세요.",
        3: "견적 항목이 최소 1개 이상 있어야 합니다.",
      };
      toast({
        title: "입력 확인",
        description: messages[currentStep] ?? "필수 항목을 확인해주세요.",
        variant: "destructive",
      });
      return;
    }
    nextStep();
  }, [canProceed, currentStep, nextStep, toast]);

  const steps: Record<number, React.ReactNode> = {
    0: <StepUpload />,
    1: <StepMasking />,
    2: <StepInfo />,
    3: <StepVerify />,
    4: <StepResult />,
  };

  // 결과 스텝에서는 네비게이션 숨김
  const isResultStep = currentStep === DIAGNOSIS_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-4 p-4">
      <MultiStepForm steps={STEP_CONFIGS} currentStep={currentStep}>
        {steps[currentStep]}
      </MultiStepForm>

      {!isResultStep && (
        <StepNavigation
          currentStep={currentStep}
          totalSteps={DIAGNOSIS_STEPS.length - 1}
          onPrev={prevStep}
          onNext={handleNext}
          isNextDisabled={false}
          submitLabel="진단 시작"
        />
      )}
    </div>
  );
}
