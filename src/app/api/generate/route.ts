import { NextRequest, NextResponse } from "next/server";
import { queuePrompt, uploadImage } from "@/lib/comfy";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "이미지 파일이 필요합니다." }, { status: 400 });
  }

  try {
    const uploadedFilename = await uploadImage(file);
    const promptId = await queuePrompt(uploadedFilename);
    return NextResponse.json({ promptId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
