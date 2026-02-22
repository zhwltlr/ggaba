import { getProfile, getMyPosts, getMyComments } from "./_actions/profile";
import MyPageClient from "./_components/mypage-client";

export default async function MyPage() {
  const [profileRes, postsRes, commentsRes] = await Promise.all([
    getProfile(),
    getMyPosts(),
    getMyComments(),
  ]);

  return (
    <MyPageClient
      initialProfile={profileRes.profile as Parameters<typeof MyPageClient>[0]["initialProfile"]}
      initialPosts={(postsRes.posts ?? []) as Record<string, unknown>[]}
      initialComments={(commentsRes.comments ?? []) as Record<string, unknown>[]}
    />
  );
}
