"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import {
  PenSquare,
  MessageCircle,
  LogOut,
  Crown,
  Coins,
  ChevronRight,
  Check,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserStore, type UserMode } from "@/stores/use-user-store";
import { updateProfile, updateUserMode } from "../_actions/profile";

interface Profile {
  id: string;
  email: string;
  nickname: string;
  role: string;
  tier: string;
  points: number;
  profile_image_url: string | null;
  user_mode: UserMode;
  business_profile_id: string | null;
  created_at: string;
}

const TIER_STYLES: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-muted text-muted-foreground" },
  basic: { label: "Basic", className: "bg-primary/10 text-primary" },
  premium: { label: "Premium", className: "bg-warning/10 text-warning" },
};

export default function MyPageClient({
  initialProfile,
  initialPosts,
  initialComments,
}: {
  initialProfile: Profile | null;
  initialPosts: Record<string, unknown>[];
  initialComments: Record<string, unknown>[];
}) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { userMode, setUserMode } = useUserStore();

  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [myPosts] = useState(initialPosts);
  const [myComments] = useState(initialComments);
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");
  const [switchingMode, setSwitchingMode] = useState(false);

  const handleModeSwitch = useCallback(async () => {
    if (!profile) return;
    const targetMode: UserMode = userMode === "consumer" ? "contractor" : "consumer";

    if (targetMode === "contractor" && !profile.business_profile_id) {
      router.push("/onboarding/contractor");
      return;
    }

    setSwitchingMode(true);
    const result = await updateUserMode(targetMode);
    if (result.error) {
      toast({ title: "모드 전환 실패", description: result.error, variant: "destructive" });
      setSwitchingMode(false);
      return;
    }

    setUserMode(targetMode);
    setProfile((prev) => (prev ? { ...prev, user_mode: targetMode } : prev));
    toast({ title: targetMode === "contractor" ? "시공사 모드로 전환했습니다" : "소비자 모드로 전환했습니다" });
    setSwitchingMode(false);
  }, [profile, userMode, setUserMode, router, toast]);

  const handleSaveNickname = useCallback(async () => {
    if (!newNickname.trim() || newNickname.trim().length > 50) return;
    const result = await updateProfile({ nickname: newNickname.trim() });
    if (result.error) {
      toast({
        title: "수정 실패",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    setProfile((prev) =>
      prev ? { ...prev, nickname: newNickname.trim() } : prev
    );
    setEditingNickname(false);
    toast({ title: "닉네임이 수정되었습니다" });
  }, [newNickname, toast]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">프로필을 불러올 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push("/login")}>
          로그인하기
        </Button>
      </div>
    );
  }

  const tier = TIER_STYLES[profile.tier] ?? TIER_STYLES.free;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 프로필 섹션 */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {profile.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_image_url}
                alt="프로필"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              profile.nickname.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {editingNickname ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="h-7 w-32 text-sm"
                    maxLength={50}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveNickname();
                      if (e.key === "Escape") setEditingNickname(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    className="rounded p-0.5 hover:bg-muted"
                  >
                    <Check className="h-4 w-4 text-safe" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNickname(false)}
                    className="rounded p-0.5 hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-base font-semibold">
                    {profile.nickname}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewNickname(profile.nickname);
                      setEditingNickname(true);
                    }}
                    className="rounded p-0.5 hover:bg-muted"
                  >
                    <PenSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  tier.className
                )}
              >
                <Crown className="mr-0.5 inline h-3 w-3" />
                {tier.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 포인트 */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium">포인트</span>
          </div>
          <span className="text-lg font-bold text-primary">
            {profile.points.toLocaleString()}P
          </span>
        </CardContent>
      </Card>

      {/* 모드 전환 */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">모드 전환</span>
              <p className="text-[10px] text-muted-foreground">
                현재: {userMode === "consumer" ? "소비자" : "시공사"} 모드
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleModeSwitch}
            disabled={switchingMode}
          >
            {userMode === "consumer" ? "시공사로 전환" : "소비자로 전환"}
          </Button>
        </CardContent>
      </Card>

      {/* 내 활동 탭 */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={cn(
              "flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors",
              activeTab === "posts"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            내 게시글 ({myPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={cn(
              "flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors",
              activeTab === "comments"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            내 댓글 ({myComments.length})
          </button>
        </div>

        {activeTab === "posts" && (
          <div className="flex flex-col gap-2">
            {myPosts.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                아직 작성한 게시글이 없습니다
              </p>
            ) : (
              myPosts.map((post) => (
                <Card
                  key={post.id as string}
                  className="cursor-pointer transition-colors hover:bg-accent/30"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {post.title as string}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(post.created_at as string).toLocaleDateString("ko-KR")}
                        {" · 조회 "}
                        {String(post.view_count)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="flex flex-col gap-2">
            {myComments.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                아직 작성한 댓글이 없습니다
              </p>
            ) : (
              myComments.map((comment) => {
                const commentPost = comment.community_posts as Record<string, unknown> | null;
                return (
                  <Card
                    key={comment.id as string}
                    className="cursor-pointer transition-colors hover:bg-accent/30"
                    onClick={() => {
                      if (commentPost?.id) {
                        router.push(`/community/${commentPost.id}`);
                      }
                    }}
                  >
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          <MessageCircle className="mr-1 inline h-3 w-3" />
                          {commentPost?.title ? String(commentPost.title) : "게시글"}
                        </p>
                        <p className="mt-0.5 text-sm line-clamp-1">
                          {comment.content as string}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(comment.created_at as string).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 설정 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">설정</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 p-2">
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
