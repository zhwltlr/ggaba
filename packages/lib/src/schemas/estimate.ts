import { z } from "zod";

export const estimateItemSchema = z.object({
  category: z.string().min(1, "카테고리를 입력해주세요"),
  item: z.string().min(1, "항목명을 입력해주세요"),
  unit: z.string().min(1, "단위를 입력해주세요"),
  quantity: z.number().positive("수량은 0보다 커야 합니다"),
  unitPrice: z.number().nonnegative("단가는 0 이상이어야 합니다"),
  totalPrice: z.number().nonnegative("금액은 0 이상이어야 합니다"),
  note: z.string().optional(),
});

export const estimateUploadSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(100),
  description: z.string().max(500).optional(),
  file: z.custom<File>(
    (val) => val instanceof File,
    "파일을 업로드해주세요"
  ),
});

export type EstimateItem = z.infer<typeof estimateItemSchema>;
export type EstimateUpload = z.infer<typeof estimateUploadSchema>;
