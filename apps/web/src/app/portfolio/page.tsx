import { Image } from "lucide-react";

export default function PortfolioPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <Image className="h-12 w-12 text-muted-foreground/50" />
      <div>
        <h1 className="text-lg font-bold">포트폴리오</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phase 5에서 구현 예정입니다
        </p>
      </div>
    </div>
  );
}
