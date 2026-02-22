import { Skeleton } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";

export default function ChatRoomLoading() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b p-4">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-10 w-2/3 rounded-lg",
              i % 2 === 0 ? "self-start" : "self-end"
            )}
          />
        ))}
      </div>
    </div>
  );
}
