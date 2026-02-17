import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  BagajiScore,
  Skeleton,
} from "@ggaba/ui";
import { ClipboardCheck, TrendingDown, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-8">
      {/* Hero */}
      <section className="flex flex-col gap-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          인테리어 견적,
          <br />
          <span className="text-primary">바가지</span> 없이 투명하게
        </h1>
        <p className="text-sm text-muted-foreground">
          견적서를 올리면 AI가 적정 가격을 분석해드립니다
        </p>
        <Button size="lg" className="mt-2" asChild>
          <Link href="/diagnosis">
            <ClipboardCheck className="mr-2 h-5 w-5" />
            무료 견적 진단받기
          </Link>
        </Button>
      </section>

      {/* Demo Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">바가지 점수 예시</CardTitle>
          <CardDescription>
            0에 가까울수록 합리적인 가격입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BagajiScore score={35} />
        </CardContent>
      </Card>

      {/* Features */}
      <section className="grid gap-3">
        <FeatureCard
          icon={<ClipboardCheck className="h-6 w-6 text-primary" />}
          title="AI 견적 진단"
          description="견적서 사진만 올리면 항목별 적정 가격을 분석합니다"
        />
        <FeatureCard
          icon={<TrendingDown className="h-6 w-6 text-safe" />}
          title="시세 비교"
          description="지역별, 평수별 평균 시세와 비교해드립니다"
        />
        <FeatureCard
          icon={<Shield className="h-6 w-6 text-primary" />}
          title="개인정보 보호"
          description="업로드한 견적서의 개인정보는 자동으로 마스킹됩니다"
        />
      </section>

      {/* Skeleton Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 진단 결과</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="rounded-lg bg-accent p-2">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
