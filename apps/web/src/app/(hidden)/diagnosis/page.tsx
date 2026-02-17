"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@ggaba/ui";
import { ClipboardCheck, Upload, Shield, BarChart3 } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "견적서 업로드",
    desc: "견적서 사진이나 파일을 올려주세요",
  },
  {
    icon: Shield,
    title: "개인정보 마스킹",
    desc: "민감한 정보를 블러 처리합니다",
  },
  {
    icon: ClipboardCheck,
    title: "항목 확인",
    desc: "추출된 항목을 검토하고 수정합니다",
  },
  {
    icon: BarChart3,
    title: "진단 결과",
    desc: "바가지 점수와 항목별 분석을 확인하세요",
  },
];

export default function DiagnosisPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-4 pt-8">
      <section className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          견적서 <span className="text-primary">진단</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          견적서를 업로드하면 AI가 항목별 적정 가격을 분석합니다
        </p>
      </section>

      <section className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <Card key={step.title}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  <span className="mr-2 text-primary">STEP {i + 1}</span>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Button
        size="lg"
        className="w-full"
        onClick={() => router.push("/diagnosis/flow")}
      >
        <ClipboardCheck className="mr-2 h-5 w-5" />
        진단 시작하기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">안내</CardTitle>
          <CardDescription className="text-xs">
            업로드된 견적서는 암호화되어 안전하게 보관되며, 개인정보는 자동으로
            마스킹 처리됩니다. 진단 결과는 &apos;금고&apos;에 저장됩니다.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
