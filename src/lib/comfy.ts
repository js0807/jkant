import fs from "node:fs/promises";
import path from "node:path";

const WORKFLOW_PATH = path.join(process.cwd(), "workflows", "ai_final_work.json");

const LOAD_IMAGE_NODE_ID = "12";
const SAVE_VIDEO_NODE_ID = "14";

const DEFAULT_BASE_URL = "https://cloud.comfy.org";

const TERMINAL_FAILURE_STATUSES = new Set(["failed", "error", "cancelled"]);

function cloudBaseUrl(): string {
  return (process.env.COMFY_CLOUD_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

function apiKey(): string {
  const key = process.env.COMFY_CLOUD_API_KEY;
  if (!key) {
    throw new Error("COMFY_CLOUD_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return key;
}

function authHeaders(): HeadersInit {
  return { "X-API-Key": apiKey() };
}

export type VideoRef = {
  filename: string;
  subfolder: string;
  type: string;
};

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file, file.name || "upload.png");

  const res = await fetch(`${cloudBaseUrl()}/api/upload/image`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Comfy Cloud 이미지 업로드 실패: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { name: string };
  return data.name;
}

export async function queuePrompt(uploadedFilename: string): Promise<string> {
  const raw = await fs.readFile(WORKFLOW_PATH, "utf-8");
  const workflow = JSON.parse(raw);

  workflow[LOAD_IMAGE_NODE_ID].inputs.image = uploadedFilename;

  const res = await fetch(`${cloudBaseUrl()}/api/prompt`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: workflow,
      // Partner/API nodes (e.g. GrokVideoNode) only get their auth context from
      // the browser session by default; this re-supplies it for headless calls.
      // https://docs.comfy.org/development/comfyui-server/api-key-integration
      extra_data: { api_key_comfy_org: apiKey() },
    }),
  });

  if (!res.ok) {
    throw new Error(`Comfy Cloud 프롬프트 큐 등록 실패: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { prompt_id: string };
  return data.prompt_id;
}

export async function getHistory(promptId: string): Promise<VideoRef | null> {
  const res = await fetch(`${cloudBaseUrl()}/api/jobs/${promptId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Comfy Cloud 작업 조회 실패: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    outputs?: Record<
      string,
      { images?: VideoRef[]; videos?: VideoRef[]; gifs?: VideoRef[] }
    >;
  };

  if (TERMINAL_FAILURE_STATUSES.has(data.status)) {
    throw new Error(data.error_message ?? `작업이 실패했습니다 (status: ${data.status})`);
  }

  if (data.status !== "completed") {
    return null;
  }

  // Comfy Cloud returns the SaveVideo node's output under "images" (with
  // animated: true) rather than "videos"/"gifs" like self-hosted ComfyUI.
  const nodeOutput = data.outputs?.[SAVE_VIDEO_NODE_ID];
  const video = nodeOutput?.images?.[0] ?? nodeOutput?.videos?.[0] ?? nodeOutput?.gifs?.[0];
  return video ?? null;
}

export async function fetchVideoStream(ref: VideoRef): Promise<Response> {
  const params = new URLSearchParams({
    filename: ref.filename,
    type: ref.type,
  });

  const res = await fetch(`${cloudBaseUrl()}/api/view?${params.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Comfy Cloud 영상 조회 실패: ${res.status}`);
  }
  return res;
}
