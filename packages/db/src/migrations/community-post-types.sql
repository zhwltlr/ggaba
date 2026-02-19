-- 커뮤니티 게시글 타입 확장: 시공사 전용 카테고리
ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'contractor_tip';
ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'material_info';
