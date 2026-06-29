"use client";

import { useEffect, useRef, useState } from "react";

type Stage = "idle" | "generating" | "done" | "error";

const STORY_BEATS = [
  "야근을 마치고 돌아오던 길, 골목 어귀엔 쓰레기통이 가득 넘쳐 있었어요.",
  "다들 잠든 그 시각, 저 많은 것들이 다 누구의 손길로 사라지는 걸까 작게 궁금해졌죠.",
  "그리고 아무도 모르는 새벽, 작은 요정 하나가 살그머니 내려앉습니다.",
  "그녀는 늘 그래왔던 것처럼, 묻지도 않고 묵묵히 일을 시작해요.",
  "별빛을 닮은 가루를 톡, 톡 뿌리며 조용히 마법을 겁니다.",
  "쌓여 있던 더러움은 반짝이는 빛이 되어, 한 줌의 바람처럼 흩어지고요.",
  "박수도, 인사도 없이, 요정은 다시 다음 골목으로 총총 떠나갑니다.",
  "우리가 당연하게 맞이하는 깨끗한 아침은, 누군가의 보이지 않는 손길 덕분이에요.",
  "그 보이지 않는 손길에, 작은 감사 하나를 몰래 적어 봅니다.",
];

const TYPE_SPEED_MS = 45;
const HOLD_AFTER_TYPED_MS = 1800;
const HOLD_AFTER_ERASED_MS = 300;
const ERASE_SPEED_MS = 18;

function TypewriterStory() {
  const [beatIndex, setBeatIndex] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    let charIndex = 0;
    let timer: ReturnType<typeof setTimeout>;
    const fullText = STORY_BEATS[beatIndex];

    function typeNext() {
      charIndex += 1;
      setText(fullText.slice(0, charIndex));

      if (charIndex < fullText.length) {
        timer = setTimeout(typeNext, TYPE_SPEED_MS);
      } else {
        timer = setTimeout(eraseStart, HOLD_AFTER_TYPED_MS);
      }
    }

    function eraseStart() {
      eraseNext();
    }

    function eraseNext() {
      charIndex -= 1;
      setText(fullText.slice(0, Math.max(charIndex, 0)));

      if (charIndex > 0) {
        timer = setTimeout(eraseNext, ERASE_SPEED_MS);
      } else {
        timer = setTimeout(() => {
          setBeatIndex((i) => (i + 1) % STORY_BEATS.length);
        }, HOLD_AFTER_ERASED_MS);
      }
    }

    timer = setTimeout(typeNext, TYPE_SPEED_MS);
    return () => clearTimeout(timer);
  }, [beatIndex]);

  return (
    <p className="text-base leading-relaxed min-h-24">
      {text}
      <span className="caret gold-text">▌</span>
    </p>
  );
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    selectedFileRef.current = file;
    setPreviewUrl(URL.createObjectURL(file));
    setVideoUrl(null);
    setErrorMessage(null);
    setStage("idle");
  }

  async function pollStatus(promptId: string) {
    const res = await fetch(`/api/status?id=${encodeURIComponent(promptId)}`);
    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data.error ?? "변환에 실패했습니다.");
      setStage("error");
      return;
    }

    if (data.status === "done") {
      setVideoUrl(data.videoUrl);
      setStage("done");
      return;
    }

    setTimeout(() => pollStatus(promptId), 3000);
  }

  async function handleGenerate() {
    const file = selectedFileRef.current;
    if (!file) return;

    setStage("generating");
    setErrorMessage(null);

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch("/api/generate", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "변환 시작에 실패했습니다.");
        setStage("error");
        return;
      }

      pollStatus(data.promptId);
    } catch {
      setErrorMessage("서버에 연결할 수 없습니다.");
      setStage("error");
    }
  }

  function handleReset() {
    selectedFileRef.current = null;
    setPreviewUrl(null);
    setVideoUrl(null);
    setErrorMessage(null);
    setStage("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!started) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="book-frame fade-in-scale w-full max-w-xl rounded-2xl p-10 text-center relative overflow-hidden">
          <span className="twinkle absolute top-6 left-8 text-xl">✨</span>
          <span className="twinkle absolute top-10 right-10 text-sm" style={{ animationDelay: "0.6s" }}>
            ✨
          </span>
          <span className="twinkle absolute bottom-10 left-12 text-sm" style={{ animationDelay: "1.2s" }}>
            ✨
          </span>

          <div className="fairy-float text-6xl mb-4">🧚</div>

          <h1 className="title-font font-extrabold gold-text text-4xl tracking-wide mb-1">
            아무도 모르는 밤의 요정
          </h1>
          <p className="text-sm text-(--ink)/70 mb-6">(The Night Fairy No One Knows)</p>

          <p className="text-sm leading-relaxed mb-8 text-(--ink)/80">
            세상의 한 조각을 요정에게 맡겨보세요.
            <br />
            그녀가 밤새 마법을 부려, 작은 영상 하나를 남겨둘 거예요.
          </p>

          <button
            onClick={() => setStarted(true)}
            className="start-button rounded-full px-10 py-3 font-bold text-[#2c2018] title-font text-lg"
          >
            ✨ 시작하기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="book-frame fade-in-scale w-full max-w-6xl rounded-2xl p-8">
        <span className="ornament top-3 left-4">❧</span>
        <span className="ornament top-3 right-4" style={{ transform: "scaleX(-1)" }}>
          ❧
        </span>
        <span className="ornament bottom-3 left-4" style={{ transform: "scaleY(-1)" }}>
          ❧
        </span>
        <span
          className="ornament bottom-3 right-4"
          style={{ transform: "scale(-1, -1)" }}
        >
          ❧
        </span>

        <header className="text-center mb-8">
          <h1 className="title-font font-extrabold gold-text text-4xl tracking-wide">
            아무도 모르는 밤의 요정
          </h1>
          <p className="text-sm mt-1 text-(--ink)/70">(The Night Fairy No One Knows)</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 이미지 삽입창 */}
          <section className="ornate-panel rounded-xl p-5 flex flex-col">
            <h2 className="text-center font-bold mb-1">이미지 삽입창</h2>
            <p className="text-center text-xs mb-4 text-(--ink)/60">
              IMAGE INSERTION
            </p>
            <label
              htmlFor="image-input"
              className="flex-1 border-2 border-dashed border-(--gold) rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[rgba(184,134,47,0.08)] transition overflow-hidden"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="선택된 이미지"
                  className="max-h-48 object-contain rounded"
                />
              ) : (
                <>
                  <span className="gold-text font-bold text-lg">[+] 사진 삽입</span>
                  <span className="text-xs text-(--ink)/60">
                    세상의 한 조각을 올려주세요...
                  </span>
                </>
              )}
            </label>
            <input
              id="image-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {stage === "idle" && previewUrl && (
              <button
                onClick={handleGenerate}
                className="mt-4 rounded-lg border-2 border-(--gold) py-2 font-bold gold-text hover:bg-[rgba(184,134,47,0.12)] transition"
              >
                변환 시작
              </button>
            )}
            {(stage === "done" || stage === "error") && (
              <button
                onClick={handleReset}
                className="mt-4 rounded-lg border-2 border-(--gold) py-2 font-bold gold-text hover:bg-[rgba(184,134,47,0.12)] transition"
              >
                다시 시작
              </button>
            )}
          </section>

          {/* 변환 중 */}
          <section className="ornate-panel rounded-xl p-5 flex flex-col items-center text-center">
            <h2 className="gold-text font-bold mb-3">
              {stage === "generating" ? "요정의 이야기가 쓰이고 있어요..." : "요정의 이야기"}
            </h2>
            <div className="flex-1 flex items-center">
              {stage === "generating" ? (
                <TypewriterStory />
              ) : (
                <p className="text-sm leading-relaxed text-(--ink)/70">
                  이미지를 올리고 변환을 시작하면, 요정이 밤새 써 내려간 이야기가
                  여기에 펼쳐집니다.
                </p>
              )}
            </div>
            {stage === "generating" && (
              <div className="w-full h-2 rounded-full overflow-hidden border border-(--gold) mt-4">
                <div className="progress-fill h-full w-full" />
              </div>
            )}
            {stage === "error" && errorMessage && (
              <p className="mt-4 text-sm text-red-700">{errorMessage}</p>
            )}
          </section>

          {/* 영상 추출창 */}
          <section className="ornate-panel rounded-xl p-5 flex flex-col">
            <h2 className="text-center font-bold mb-1">영상 추출창</h2>
            <p className="text-center text-xs mb-4 text-(--ink)/60">
              VIDEO OUTPUT (Generated Video)
            </p>
            <div className="flex-1 rounded-lg border-2 border-(--gold) flex items-center justify-center overflow-hidden bg-black/10">
              {videoUrl ? (
                <video src={videoUrl} controls className="w-full h-full object-contain" />
              ) : (
                <span className="text-sm text-(--ink)/50">아직 결과가 없습니다</span>
              )}
            </div>
            {videoUrl && (
              <a
                href={videoUrl}
                download
                className="mt-4 rounded-lg border-2 border-(--gold) py-2 text-center font-bold gold-text hover:bg-[rgba(184,134,47,0.12)] transition"
              >
                다운로드
              </a>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
