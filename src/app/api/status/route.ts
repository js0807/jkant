import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/comfy";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const promptId = req.nextUrl.searchParams.get("id");
  if (!promptId) {
    return NextResponse.json({ error: "id 쿼리 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const video = await getHistory(promptId);
    if (!video) {
      return NextResponse.json({ status: "pending" });
    }

    const videoUrl = `/api/video?${new URLSearchParams({
      filename: video.filename,
      subfolder: video.subfolder,
      type: video.type,
    }).toString()}`;

    return NextResponse.json({ status: "done", videoUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
