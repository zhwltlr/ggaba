import Link from "next/link";
import { Button } from "@ggaba/ui";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Search className="h-10 w-10 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-4xl font-bold text-primary">404</h2>
        <p className="mt-2 text-lg font-semibold">페이지를 찾을 수 없습니다</p>
        <p className="mt-1 text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          홈으로 돌아가기
        </Link>
      </Button>
    </div>
  );
}
