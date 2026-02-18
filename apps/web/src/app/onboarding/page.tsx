"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { UserCircle } from "lucide-react";
import { updateProfile } from "@/app/mypage/_actions/profile";

export default function ConsumerOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = nickname.trim().length >= 2;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    const result = await updateProfile({ nickname: nickname.trim() });

    if (result.error) {
      toast({
        title: "등록 실패",
        description: result.error,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    toast({ title: "환영합니다! 프로필이 설정되었습니다." });
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3 py-2">
        <UserCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-lg font-bold">프로필 설정</h1>
          <p className="text-xs text-muted-foreground">
            서비스 이용을 위해 닉네임을 설정해주세요
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium">닉네임</label>
            <Input
              placeholder="2자 이상 입력해주세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        disabled={!isValid || submitting}
        onClick={handleSubmit}
      >
        {submitting ? "저장 중..." : "시작하기"}
      </Button>
    </div>
  );
}
