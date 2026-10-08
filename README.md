# AI 챗봇

OpenAI API를 사용하는 간단한 한국어 웹 챗봇입니다. 정적 화면과 Express API를 하나의 Node.js 앱으로 제공합니다.

## 로컬 실행

Node.js 20 이상이 필요합니다.

```bash
npm install
cp .env.example .env
```

`.env`의 `OPENAI_API_KEY`에 OpenAI API 키를 입력한 뒤 실행합니다.

```bash
npm start
```

브라우저에서 <http://localhost:3000>을 엽니다. `PORT`를 지정하지 않으면 로컬 기본 포트 `3000`을 사용합니다.

## 환경 변수

| 이름 | 설명 | 기본값 |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API 키 | 없음 |
| `PORT` | HTTP 서버 포트 (호스팅 플랫폼이 지정) | `3000` |

실제 배포에서는 플랫폼의 환경 변수 설정에 `OPENAI_API_KEY`를 등록하세요. `.env` 파일은 Git에서 제외됩니다.

## 배포 (Render)

저장소를 Render에 연결하고 `render.yaml`의 Web Service 구성을 사용하세요. Render 대시보드에서 `OPENAI_API_KEY` 값을 설정하면 배포할 수 있습니다. 서버는 플랫폼이 제공하는 `PORT`를 사용하며 `/health`에서 상태를 확인할 수 있습니다.

## 프로젝트 구성

```text
.
├── app.js          # Express 앱과 API
├── server.js       # HTTP 서버 시작점
├── public/         # 브라우저 화면과 정적 자산
├── test/           # 자동화 테스트
├── .env.example    # 필요한 환경 변수 이름
└── render.yaml     # Render 배포 설정
```

대화 기록은 서버 메모리에 보관되므로 서버 재시작이나 인스턴스 변경 시 초기화됩니다.

## 테스트

```bash
npm test
```
