"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, Skeleton } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { MessagesSquare } from "lucide-react";
import { useChatRooms } from "@/hooks/use-chat";
import type { ChatRoom } from "./_types";

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export default function ChatListPage() {
  const router = useRouter();
  const { data, isLoading } = useChatRooms();

  const rooms = data?.rooms ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">채팅</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex gap-3 p-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MessagesSquare className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            진행 중인 채팅이 없습니다
          </p>
          <p className="text-xs text-muted-foreground">
            경매에서 시공사를 선택하면 채팅이 시작됩니다
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <ChatRoomCard
              key={room.id}
              room={room}
              onClick={() => router.push(`/chat/${room.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatRoomCard({
  room,
  onClick,
}: {
  room: ChatRoom;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/30"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 p-4">
        {/* 아바타 */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {room.other_user_nickname.charAt(0)}
        </div>

        {/* 내용 */}
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold truncate">
              {room.other_user_nickname}
            </span>
            {room.last_message_at && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatTime(room.last_message_at)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="truncate text-xs text-muted-foreground">
              {room.last_message ?? room.auction_title}
            </p>
            {room.unread_count > 0 && (
              <span
                className={cn(
                  "ml-2 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground"
                )}
              >
                {room.unread_count > 99 ? "99+" : room.unread_count}
              </span>
            )}
          </div>
          <p className="truncate text-[10px] text-muted-foreground/70">
            {room.auction_title}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
