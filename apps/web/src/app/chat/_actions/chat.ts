"use server";

import { createClient } from "@/lib/supabase/server";
import type { ChatRoom, ChatRoomDetail, Message } from "../_types";

const PAGE_SIZE = 30;

export async function getChatRooms() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { rooms: [], error: "로그인이 필요합니다." };
  }

  // 내가 속한 채팅방 조회
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select(
      "id, auction_id, consumer_id, contractor_id, status, created_at, updated_at, auctions(title)"
    )
    .or(`consumer_id.eq.${user.id},contractor_id.eq.${user.id}`)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error) {
    return { rooms: [], error: error.message };
  }

  const roomList = rooms ?? [];
  if (roomList.length === 0) {
    return { rooms: [], error: null };
  }

  const roomIds = roomList.map((r) => r.id);
  const otherUserIds = roomList.map((r) =>
    r.consumer_id === user.id ? r.contractor_id : r.consumer_id
  );
  const uniqueOtherUserIds = [...new Set(otherUserIds)];

  // 배치 쿼리 3개를 병렬 실행 (N+1 → 4 쿼리)
  const [nicknameResult, messagesResult, unreadResult] = await Promise.all([
    // 1) 모든 상대방 닉네임 일괄 조회
    supabase
      .from("users")
      .select("id, nickname")
      .in("id", uniqueOtherUserIds),
    // 2) 모든 방의 메시지 일괄 조회 (최신순 → JS에서 방별 첫 번째 추출)
    supabase
      .from("messages")
      .select("chat_room_id, content, created_at")
      .in("chat_room_id", roomIds)
      .order("created_at", { ascending: false }),
    // 3) 모든 안 읽은 메시지 일괄 조회
    supabase
      .from("messages")
      .select("chat_room_id")
      .in("chat_room_id", roomIds)
      .neq("sender_id", user.id)
      .is("read_at", null),
  ]);

  // 닉네임 맵
  const nicknameMap = new Map(
    (nicknameResult.data ?? []).map((u) => [u.id, u.nickname])
  );

  // 방별 마지막 메시지 맵 (이미 최신순 정렬 → 첫 번째 등장이 최신)
  const lastMessageMap = new Map<string, { content: string; created_at: string }>();
  for (const msg of messagesResult.data ?? []) {
    if (!lastMessageMap.has(msg.chat_room_id)) {
      lastMessageMap.set(msg.chat_room_id, {
        content: msg.content,
        created_at: msg.created_at,
      });
    }
  }

  // 방별 안 읽은 수 맵
  const unreadMap = new Map<string, number>();
  for (const msg of unreadResult.data ?? []) {
    unreadMap.set(msg.chat_room_id, (unreadMap.get(msg.chat_room_id) ?? 0) + 1);
  }

  const chatRooms: ChatRoom[] = roomList.map((room) => {
    const otherUserId =
      room.consumer_id === user.id ? room.contractor_id : room.consumer_id;
    const auction = room.auctions as unknown as { title: string } | null;
    const lastMsg = lastMessageMap.get(room.id);

    return {
      id: room.id,
      auction_id: room.auction_id,
      consumer_id: room.consumer_id,
      contractor_id: room.contractor_id,
      status: room.status as ChatRoom["status"],
      created_at: room.created_at,
      updated_at: room.updated_at,
      auction_title: auction?.title ?? "",
      other_user_nickname: nicknameMap.get(otherUserId) ?? "알 수 없음",
      last_message: lastMsg?.content ?? null,
      last_message_at: lastMsg?.created_at ?? null,
      unread_count: unreadMap.get(room.id) ?? 0,
    };
  });

  return { rooms: chatRooms, error: null };
}

export async function getChatRoomDetail(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { room: null, error: "로그인이 필요합니다." };
  }

  const { data: room, error } = await supabase
    .from("chat_rooms")
    .select(
      "id, auction_id, consumer_id, contractor_id, status, created_at, auctions(title)"
    )
    .eq("id", roomId)
    .single();

  if (error) {
    return { room: null, error: error.message };
  }

  // 멤버 검증
  if (room.consumer_id !== user.id && room.contractor_id !== user.id) {
    return { room: null, error: "접근 권한이 없습니다." };
  }

  const otherUserId =
    room.consumer_id === user.id ? room.contractor_id : room.consumer_id;

  const { data: otherUser } = await supabase
    .from("users")
    .select("nickname")
    .eq("id", otherUserId)
    .single();

  const auction = room.auctions as unknown as { title: string } | null;

  const detail: ChatRoomDetail = {
    id: room.id,
    auction_id: room.auction_id,
    consumer_id: room.consumer_id,
    contractor_id: room.contractor_id,
    status: room.status as ChatRoomDetail["status"],
    created_at: room.created_at,
    auction_title: auction?.title ?? "",
    other_user_nickname: otherUser?.nickname ?? "알 수 없음",
  };

  return { room: detail, error: null };
}

export async function getMessages(opts: {
  roomId: string;
  cursor?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { messages: [], nextCursor: null, error: "로그인이 필요합니다." };
  }

  // 멤버 검증
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("consumer_id, contractor_id")
    .eq("id", opts.roomId)
    .single();

  if (!room || (room.consumer_id !== user.id && room.contractor_id !== user.id)) {
    return { messages: [], nextCursor: null, error: "접근 권한이 없습니다." };
  }

  let query = supabase
    .from("messages")
    .select("id, chat_room_id, sender_id, content, type, file_url, read_at, created_at")
    .eq("chat_room_id", opts.roomId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (opts.cursor) {
    query = query.lt("created_at", opts.cursor);
  }

  const { data, error } = await query;

  if (error) {
    return { messages: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const messages: Message[] = (data ?? []).slice(0, PAGE_SIZE) as Message[];

  const nextCursor = hasMore
    ? messages[messages.length - 1]?.created_at
    : null;

  return { messages, nextCursor, error: null };
}

export async function sendMessage(input: {
  roomId: string;
  content: string;
  type?: "text" | "image" | "file";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: null, error: "로그인이 필요합니다." };
  }

  // 멤버 검증
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("consumer_id, contractor_id")
    .eq("id", input.roomId)
    .single();

  if (!room || (room.consumer_id !== user.id && room.contractor_id !== user.id)) {
    return { message: null, error: "접근 권한이 없습니다." };
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      chat_room_id: input.roomId,
      sender_id: user.id,
      content: input.content,
      type: input.type ?? "text",
    })
    .select("id, chat_room_id, sender_id, content, type, file_url, read_at, created_at")
    .single();

  if (error) {
    return { message: null, error: error.message };
  }

  // 채팅방 updated_at 갱신
  await supabase
    .from("chat_rooms")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.roomId);

  return { message: message as Message, error: null };
}

export async function markAsRead(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 내가 보낸 메시지가 아닌 것만 읽음 처리
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_room_id", roomId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
