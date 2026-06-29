# 아무도 모르는 밤의 요정

🔗 **[jkant.vercel.app](https://jkant.vercel.app)**

사진 한 장을 올리면, 요정이 밤새 마법을 부려 짧은 영상으로 만들어주는 웹 데모입니다.

## 무슨 이야기를 담았나요

야근하고 돌아오던 길, 가득 넘쳐 있는 쓰레기통을 보고 든 생각에서 시작했습니다.
"저 많은 걸 다 누가 치우는 거지?"

우리는 사회가 굴러가기 위해 필요한 수많은 노동을, 마치 자연 현상처럼 당연하게 받아들이고 살아갑니다.
당연히 누려야 할 권리이긴 하지만, 그 이면에 있는 누군가의 노고에 대한 감사는 쉽게 잊혀지죠.

그 보이지 않는 손길을, 어릴 적 동화책 속 몰래 마법을 부리는 요정처럼 표현해서
작은 감사를 불러일으키고 싶었습니다.

## 사용 방법

1. 사이트에 들어가서 **"✨ 시작하기"** 버튼을 누릅니다.
2. 사진을 한 장 올립니다.
3. **"변환 시작"**을 누르고 1분 정도 기다리면, 요정이 만든 영상이 나옵니다.
4. 영상을 재생하거나 다운로드할 수 있어요.

## 어떻게 만들었나요

**Claude Code**(AI 코딩 도구)를 활용해서 **Next.js**로 웹사이트를 만들었습니다.

사진을 올리면 그걸 ComfyUI Cloud에 보내고, 그 안에서 xAI의 Grok 영상 생성 모델이
이미지를 바탕으로 영상을 만들어줍니다. 그 결과를 다시 받아와서 화면에 보여주는 구조예요.

화면 디자인(오래된 동화책 느낌의 종이 질감, 요정 캐릭터, 이야기가 타이핑되는 효과 등)도
전부 Claude Code와 대화하면서 직접 다듬었습니다.

배포는 **Vercel**이라는 서비스를 통해 했고, 그래서 누구나 링크만 있으면 바로 접속해서 써볼 수 있어요.

개발 과정을 더 자세한 이야기로 풀어둔 글은 [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md)에 따로 정리했습니다.

## 기술 스펙

- **프레임워크**: Next.js 16 (App Router, TypeScript, Turbopack)
- **스타일**: Tailwind CSS 4
- **영상 생성**: ComfyUI Cloud(`cloud.comfy.org`) REST API에 워크플로우(`workflows/ai_final_work.json`)를 큐로 등록 → 워크플로우 안의 `GrokVideoNode`가 xAI의 `grok-imagine-video` 모델을 호출해 이미지 기반 영상을 생성
- **API 라우트**:
  - `POST /api/generate` — 이미지 업로드 + 워크플로우 큐 등록, `promptId` 반환
  - `GET /api/status?id=` — 작업 상태 폴링, 완료 시 영상 URL 반환
  - `GET /api/video?...` — Comfy Cloud의 영상 파일을 프록시 스트리밍
- **인증**: Comfy Cloud API 키(`X-API-Key` 헤더) + `extra_data.api_key_comfy_org`(Partner API 노드용 헤드리스 인증)
- **환경변수**: `COMFY_CLOUD_API_KEY` (Vercel Production에 Sensitive 변수로 등록)
- **배포**: Vercel CLI(`vercel --prod`), 프로덕션 도메인 `jkant.vercel.app`
- **개발 도구**: Claude Code (Sonnet 4.6)
