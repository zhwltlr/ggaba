"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Input, Skeleton } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ArrowLeft, Send, ImagePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useChatRoomDetail,
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from "@/hooks/use-chat";
import { chatKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "../_types";
import { EscrowStatusBar } from "./_components/escrow-status-bar";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: roomData, isLoading: roomLoading } = useChatRoomDetail(roomId);
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(roomId);
  const sendMessageMutation = useSendMessage(roomId);
  const markAsReadMutation = useMarkAsRead(roomId);

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const room = roomData?.room;

  // 메시지 목록 (역순 → 시간순 정렬)
  const messages =
    messagesData?.pages.flatMap((page) => page.messages).reverse() ?? [];

  // 입장 시 읽음 처리
  useEffect(() => {
    if (roomId && user) {
      markAsReadMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);

  // 초기 로드 또는 새 메시지 시 스크롤
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad) {
      messagesEndRef.current?.scrollIntoView();
      setIsInitialLoad(false);
    }
  }, [messages.length, isInitialLoad]);

  // Supabase Realtime 구독
  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // 캐시에 직접 추가
          queryClient.setQueryData(
            chatKeys.messages(roomId),
            (old: typeof messagesData) => {
              if (!old) return old;
              const firstPage = old.pages[0];
              if (!firstPage) return old;

              // 중복 방지
              const exists = firstPage.messages.some(
                (m) => m.id === newMessage.id
              );
              if (exists) return old;

              return {
                ...old,
                pages: [
                  {
                    ...firstPage,
                    messages: [newMessage, ...firstPage.messages],
                  },
                  ...old.pages.slice(1),
                ],
              };
            }
          );

          // 새 메시지가 상대방 것이면 읽음 처리
          if (newMessage.sender_id !== user?.id) {
            markAsReadMutation.mutate();
          }

          // 스크롤
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);

  // 상단 스크롤 시 이전 메시지 로드
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      const prevHeight = container.scrollHeight;
      fetchNextPage().then(() => {
        // 스크롤 위치 유지
        requestAnimationFrame(() => {
          const newHeight = container.scrollHeight;
          container.scrollTop = newHeight - prevHeight;
        });
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 메시지 전송
  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) return;

    setInputValue("");
    await sendMessageMutation.mutateAsync({ content });

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  if (roomLoading || messagesLoading) {
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

  if (!room) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          채팅방을 찾을 수 없습니다
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/chat")}>
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold">{room.other_user_nickname}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {room.auction_title}
          </p>
        </div>
      </div>

      {/* 에스크로 상태바 */}
      <div className="border-b px-4 py-2">
        <EscrowStatusBar currentStep={0} />
      </div>

      {/* 메시지 영역 */}
      <div
        ref={messagesContainerRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">
              대화를 시작해보세요
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const showDate = shouldShowDate(messages, index);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex max-w-[75%] flex-col gap-0.5",
                      isMe ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm",
                        isMe
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-muted"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMe && msg.read_at && (
                        <span className="text-[9px] text-safe">읽음</span>
                      )}
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="border-t bg-background p-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            disabled
            title="이미지 첨부 (준비 중)"
          >
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요"
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function shouldShowDate(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  const current = new Date(messages[index].created_at).toDateString();
  const prev = new Date(messages[index - 1].created_at).toDateString();
  return current !== prev;
}
