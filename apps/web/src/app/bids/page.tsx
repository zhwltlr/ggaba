import { ClipboardList } from "lucide-react";

export default function BidsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
      <div>
        <h1 className="text-lg font-bold">입찰목록</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phase 3에서 구현 예정입니다
        </p>
      </div>
    </div>
  );
}
