import { Button } from "@ggaba/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@ggaba/ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>GGABA</CardTitle>
          <CardDescription>
            AI 기반 인테리어 견적 분석 플랫폼
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            견적서를 업로드하면 AI가 분석해드립니다.
          </p>
          <Button>견적서 업로드</Button>
        </CardContent>
      </Card>
    </main>
  );
}
