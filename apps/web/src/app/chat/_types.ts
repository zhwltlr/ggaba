export type ChatRoomStatus = "active" | "closed";
export type MessageType = "text" | "image" | "file";

export interface ChatRoom {
  id: string;
  auction_id: string;
  consumer_id: string;
  contractor_id: string;
  status: ChatRoomStatus;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  auction_title: string;
  other_user_nickname: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  file_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ChatRoomDetail {
  id: string;
  auction_id: string;
  consumer_id: string;
  contractor_id: string;
  status: ChatRoomStatus;
  created_at: string;
  auction_title: string;
  other_user_nickname: string;
}
