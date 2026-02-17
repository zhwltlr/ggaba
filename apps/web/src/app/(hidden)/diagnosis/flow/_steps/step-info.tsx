"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Card, CardContent } from "@ggaba/ui";
import {
  diagnosisInfoSchema,
  type DiagnosisInfo,
  REGIONS,
  BUILDING_TYPES,
} from "@ggaba/lib/schemas/diagnosis";
import { useDiagnosisStore } from "@/stores/use-diagnosis-store";

export function StepInfo() {
  const { userInput, setUserInput } = useDiagnosisStore();

  const {
    register,
    watch,
    formState: { errors },
    setValue,
  } = useForm<DiagnosisInfo>({
    resolver: zodResolver(diagnosisInfoSchema),
    defaultValues: {
      region: userInput.region || "",
      buildingType: userInput.buildingType || "",
      sizePyeong: userInput.sizePyeong ?? undefined,
      title: userInput.title || "",
    },
    mode: "onChange",
  });

  // 필드 변경 시 스토어에 저장
  const region = watch("region");
  const buildingType = watch("buildingType");
  const sizePyeong = watch("sizePyeong");
  const title = watch("title");

  useEffect(() => {
    setUserInput({
      region,
      buildingType,
      sizePyeong: sizePyeong ?? null,
      title,
    });
  }, [region, buildingType, sizePyeong, title, setUserInput]);

  // 제목 자동 생성
  useEffect(() => {
    if (region && sizePyeong && buildingType) {
      const regionShort = region.split(" ").pop() ?? region;
      const autoTitle = `${regionShort} ${sizePyeong}평 ${buildingType} 견적`;
      setValue("title", autoTitle);
    }
  }, [region, sizePyeong, buildingType, setValue]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          {/* 지역 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              지역 <span className="text-destructive">*</span>
            </label>
            <select
              {...register("region")}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">선택해주세요</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {errors.region && (
              <p className="text-xs text-destructive">{errors.region.message}</p>
            )}
          </div>

          {/* 건물 유형 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              건물 유형 <span className="text-destructive">*</span>
            </label>
            <select
              {...register("buildingType")}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">선택해주세요</option>
              {BUILDING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.buildingType && (
              <p className="text-xs text-destructive">
                {errors.buildingType.message}
              </p>
            )}
          </div>

          {/* 평수 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              평수 <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              placeholder="예: 24"
              {...register("sizePyeong", { valueAsNumber: true })}
            />
            {errors.sizePyeong && (
              <p className="text-xs text-destructive">
                {errors.sizePyeong.message}
              </p>
            )}
          </div>

          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              제목 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="자동 생성됩니다"
              {...register("title")}
            />
            <p className="text-xs text-muted-foreground">
              지역, 평수, 건물유형 입력 시 자동으로 생성됩니다
            </p>
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
