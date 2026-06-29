import { NextRequest, NextResponse } from "next/server";
import { fetchVideoStream } from "@/lib/comfy";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("filename");
  const subfolder = req.nextUrl.searchParams.get("subfolder") ?? "";
  const type = req.nextUrl.searchParams.get("type") ?? "output";

  if (!filename) {
    return NextResponse.json({ error: "filename 쿼리 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const upstream = await fetchVideoStream({ filename, subfolder, type });
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "video/mp4",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
