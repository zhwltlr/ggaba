"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadPortfolioImage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const file = formData.get("file") as File;
  if (!file) return { error: "파일이 없습니다." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("portfolio-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) return { error: `업로드 실패: ${error.message}` };

  const {
    data: { publicUrl },
  } = supabase.storage.from("portfolio-images").getPublicUrl(data.path);

  return { url: publicUrl, path: data.path };
}
