-- ============================================
-- Chat RLS Policies & Realtime 설정
-- Phase 4: Match & Communication
-- ============================================

-- Realtime 활성화 (messages 테이블)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ── chat_rooms RLS ──

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- 채팅방 조회: 소비자 또는 시공사 본인만
CREATE POLICY "chat_rooms_select_own"
  ON chat_rooms
  FOR SELECT
  USING (
    auth.uid() = consumer_id
    OR auth.uid() = contractor_id
  );

-- 채팅방 생성: 인증된 사용자 (서버에서만 실행되지만 RLS 정책 필요)
CREATE POLICY "chat_rooms_insert_authenticated"
  ON chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() = consumer_id);

-- ── messages RLS ──

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 메시지 조회: 해당 채팅방 멤버만
CREATE POLICY "messages_select_room_member"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = messages.chat_room_id
        AND (chat_rooms.consumer_id = auth.uid() OR chat_rooms.contractor_id = auth.uid())
    )
  );

-- 메시지 전송: 해당 채팅방 멤버만 + 본인이 sender
CREATE POLICY "messages_insert_room_member"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = messages.chat_room_id
        AND (chat_rooms.consumer_id = auth.uid() OR chat_rooms.contractor_id = auth.uid())
    )
  );

-- 메시지 읽음 처리: 수신자만 (sender가 아닌 채팅방 멤버)
CREATE POLICY "messages_update_read"
  ON messages
  FOR UPDATE
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = messages.chat_room_id
        AND (chat_rooms.consumer_id = auth.uid() OR chat_rooms.contractor_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = messages.chat_room_id
        AND (chat_rooms.consumer_id = auth.uid() OR chat_rooms.contractor_id = auth.uid())
    )
  );
