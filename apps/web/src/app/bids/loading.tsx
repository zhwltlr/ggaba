import { Card, CardContent, Skeleton } from "@ggaba/ui";

export default function BidsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-7 w-32" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-14 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
