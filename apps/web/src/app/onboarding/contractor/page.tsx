"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { Building2 } from "lucide-react";
import { cn } from "@ggaba/lib/utils";
import { useUserStore } from "@/stores/use-user-store";
import { registerContractor } from "./_actions/register";

const SPECIALTIES = [
  "인테리어",
  "도배",
  "타일",
  "바닥",
  "전기",
  "설비",
  "페인트",
  "목공",
  "철거",
  "방수",
];

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

export default function ContractorOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUserMode, setBusinessProfileId, hydrate } = useUserStore();

  const [companyName, setCompanyName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = (
    list: string[],
    setter: (v: string[]) => void,
    item: string
  ) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const isValid =
    companyName.trim() &&
    businessNumber.trim() &&
    representativeName.trim() &&
    phone.trim() &&
    selectedSpecialties.length > 0 &&
    selectedRegions.length > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    const result = await registerContractor({
      companyName: companyName.trim(),
      businessNumber: businessNumber.trim(),
      representativeName: representativeName.trim(),
      phone: phone.trim(),
      specialty: selectedSpecialties,
      serviceRegions: selectedRegions,
    });

    if (result.error) {
      toast({
        title: "등록 실패",
        description: result.error,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // 스토어 업데이트
    setBusinessProfileId(result.businessProfileId!);
    setUserMode("contractor");
    hydrate({
      userMode: "contractor",
      businessProfileId: result.businessProfileId!,
    });

    toast({ title: "시공사 등록이 완료되었습니다" });
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3 py-2">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-lg font-bold">시공사 등록</h1>
          <p className="text-xs text-muted-foreground">
            사업자 정보를 입력하고 시공사 모드를 활성화하세요
          </p>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium">상호명</label>
            <Input
              placeholder="예: 행복건설"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              사업자번호
            </label>
            <Input
              placeholder="000-00-00000"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">대표자명</label>
            <Input
              placeholder="홍길동"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">연락처</label>
            <Input
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 전문 분야 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">전문 분야 (복수 선택)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  toggleItem(selectedSpecialties, setSelectedSpecialties, s)
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedSpecialties.includes(s)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 시공 가능 지역 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">시공 가능 지역 (복수 선택)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() =>
                  toggleItem(selectedRegions, setSelectedRegions, r)
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedRegions.includes(r)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        disabled={!isValid || submitting}
        onClick={handleSubmit}
      >
        {submitting ? "등록 중..." : "시공사 등록 완료"}
      </Button>
    </div>
  );
}
