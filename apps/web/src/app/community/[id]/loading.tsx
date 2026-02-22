import { Skeleton } from "@ggaba/ui";

export default function CommunityDetailLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
