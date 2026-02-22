import { Skeleton } from "@ggaba/ui";

export default function AuctionDetailLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
