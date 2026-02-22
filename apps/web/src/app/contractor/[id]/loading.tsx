import { Skeleton } from "@ggaba/ui";

export default function ContractorProfileLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
