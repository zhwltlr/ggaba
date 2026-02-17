import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── 진단 플로우 스텝 ──
export const DIAGNOSIS_STEPS = [
  "upload",    // 1. 견적서 업로드
  "masking",   // 2. 개인정보 마스킹 확인
  "info",      // 3. 추가 정보 입력 (지역, 평수 등)
  "verify",    // 4. 입력 데이터 확인
  "result",    // 5. 진단 결과
] as const;

export type DiagnosisStep = (typeof DIAGNOSIS_STEPS)[number];

// ── 업로드된 이미지 ──
export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

// ── OCR 추출 견적 항목 (4-tier) ──
export interface ExtractedLineItem {
  id: string;
  category: string;
  detail: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isEdited: boolean;
}

// ── 사용자 입력 정보 ──
export interface UserInput {
  region: string;
  sizePyeong: number | null;
  buildingType: string;
  title: string;
}

// ── 마스킹 옵션 ──
export interface MaskingOptions {
  isImageMasked: boolean;
  isTextMasked: boolean;
}

// ── 스토어 상태 ──
interface DiagnosisState {
  currentStep: number;
  uploadedImages: UploadedImage[];
  extractedData: ExtractedLineItem[];
  userInput: UserInput;
  masking: MaskingOptions;
  estimateId: string | null;
}

// ── 스토어 액션 ──
interface DiagnosisActions {
  // 스텝 네비게이션
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // 이미지 업로드
  setImages: (images: UploadedImage[]) => void;
  addImage: (image: UploadedImage) => void;
  removeImage: (id: string) => void;

  // OCR 추출 데이터
  setExtractedData: (data: ExtractedLineItem[]) => void;
  updateLineItem: (id: string, updates: Partial<ExtractedLineItem>) => void;
  removeLineItem: (id: string) => void;
  addLineItem: (item: ExtractedLineItem) => void;

  // 사용자 입력
  setUserInput: (input: Partial<UserInput>) => void;

  // 마스킹
  setMasking: (options: Partial<MaskingOptions>) => void;

  // 결과
  setEstimateId: (id: string) => void;

  // 리셋
  reset: () => void;
}

const initialState: DiagnosisState = {
  currentStep: 0,
  uploadedImages: [],
  extractedData: [],
  userInput: {
    region: "",
    sizePyeong: null,
    buildingType: "",
    title: "",
  },
  masking: {
    isImageMasked: true,
    isTextMasked: true,
  },
  estimateId: null,
};

export const useDiagnosisStore = create<DiagnosisState & DiagnosisActions>()(
  persist(
    (set) => ({
      ...initialState,

      // ── 스텝 네비게이션 ──
      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(
            state.currentStep + 1,
            DIAGNOSIS_STEPS.length - 1
          ),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),

      goToStep: (step) =>
        set({
          currentStep: Math.max(
            0,
            Math.min(step, DIAGNOSIS_STEPS.length - 1)
          ),
        }),

      // ── 이미지 업로드 ──
      setImages: (images) => set({ uploadedImages: images }),

      addImage: (image) =>
        set((state) => ({
          uploadedImages: [...state.uploadedImages, image],
        })),

      removeImage: (id) =>
        set((state) => ({
          uploadedImages: state.uploadedImages.filter((img) => img.id !== id),
        })),

      // ── OCR 추출 데이터 ──
      setExtractedData: (data) => set({ extractedData: data }),

      updateLineItem: (id, updates) =>
        set((state) => ({
          extractedData: state.extractedData.map((item) =>
            item.id === id ? { ...item, ...updates, isEdited: true } : item
          ),
        })),

      removeLineItem: (id) =>
        set((state) => ({
          extractedData: state.extractedData.filter((item) => item.id !== id),
        })),

      addLineItem: (item) =>
        set((state) => ({
          extractedData: [...state.extractedData, item],
        })),

      // ── 사용자 입력 ──
      setUserInput: (input) =>
        set((state) => ({
          userInput: { ...state.userInput, ...input },
        })),

      // ── 마스킹 ──
      setMasking: (options) =>
        set((state) => ({
          masking: { ...state.masking, ...options },
        })),

      // ── 결과 ──
      setEstimateId: (id) => set({ estimateId: id }),

      // ── 리셋 ──
      reset: () => set(initialState),
    }),
    {
      name: "ggaba-diagnosis",
      // File 객체 등 직렬화 불가 데이터 제외
      partialize: (state) => ({
        currentStep: state.currentStep,
        extractedData: state.extractedData,
        userInput: state.userInput,
        masking: state.masking,
        estimateId: state.estimateId,
        // uploadedImages의 url은 blob URL이라 새로고침 시 무효화 → 제외
      }),
    }
  )
);
