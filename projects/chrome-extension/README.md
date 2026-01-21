# Patent Guide Assistant - Chrome Extension

특허청(patent.go.kr) 사이트 이용을 돕는 AI 가이드 챗봇 Chrome 익스텐션입니다.

## 🚀 개발 환경 실행

### 1. 의존성 설치
```bash
cd projects/chrome-extension
npm install
```

### 2. 개발 모드 실행
```bash
npm run dev
```

개발 서버가 시작되고 `.output/chrome-mv3` 폴더에 빌드 파일이 생성됩니다.

### 3. Chrome에 익스텐션 로드

1. Chrome 브라우저에서 `chrome://extensions` 접속
2. 우측 상단의 **개발자 모드** 활성화
3. **압축해제된 확장 프로그램을 로드합니다** 클릭
4. `projects/chrome-extension/.output/chrome-mv3` 폴더 선택

### 4. 사용 방법

1. https://www.patent.go.kr 접속
2. 우측 하단에 **💬 가이드 도우미** 버튼 클릭
3. 또는 Chrome 툴바의 익스텐션 아이콘 클릭
4. 챗봇에 질문 입력 (예: "특허 출원 방법 알려줘")
5. 자동으로 Driver.js 가이드가 시작됩니다

## 📦 빌드

### 프로덕션 빌드
```bash
npm run build
```

### ZIP 파일 생성 (Chrome Web Store 배포용)
```bash
npm run zip
```

`.output` 폴더에 `.zip` 파일이 생성됩니다.

## 🏗️ 프로젝트 구조

```
chrome-extension/
├── entrypoints/
│   ├── content.ts          # patent.go.kr에 주입되는 스크립트
│   ├── background.ts       # AI API 통신 처리
│   └── popup/
│       ├── index.html      # 팝업 HTML
│       ├── main.tsx        # 팝업 진입점
│       ├── App.tsx         # 챗봇 UI 컴포넌트
│       └── style.css       # 팝업 스타일
├── public/
│   └── icon/               # 익스텐션 아이콘
├── wxt.config.ts           # WXT 설정
├── tsconfig.json           # TypeScript 설정
└── package.json
```

## 🔧 주요 기능

### Content Script (`entrypoints/content.ts`)
- patent.go.kr 페이지에 챗봇 버튼 주입
- Shadow DOM을 사용하여 페이지 스타일과 격리
- Driver.js로 요소 하이라이트 및 가이드 표시

### Background Script (`entrypoints/background.ts`)
- AI API와 통신 (현재는 더미 데이터)
- 크롬 메시지 패싱 처리

### Popup (`entrypoints/popup/`)
- 사용자 친화적인 챗봇 인터페이스
- 메시지 히스토리 관리
- AI 응답 기반 가이드 시작

## 🤖 AI 연동 (TODO)

현재는 더미 데이터를 사용하고 있습니다. 실제 AI API를 연동하려면:

1. `entrypoints/background.ts` 파일 수정
2. 주석 처리된 AI API 호출 코드 활성화
3. OpenAI, Claude 등의 API 키 설정
4. `.env` 파일에 API 키 저장

```typescript
// .env.local
VITE_OPENAI_API_KEY=your_api_key_here
```

## 📚 사용 기술

- **WXT**: Chrome Extension 개발 프레임워크
- **React 19**: UI 컴포넌트
- **TypeScript**: 타입 안전성
- **Driver.js**: 인터랙티브 가이드 라이브러리
- **Vite**: 빌드 도구

## 🔐 권한

익스텐션이 요청하는 권한:
- `activeTab`: 현재 탭 정보 접근
- `storage`: 로컬 스토리지 사용
- `scripting`: 스크립트 주입
- `host_permissions`: patent.go.kr 접근

## 📝 개발 노트

### HMR (Hot Module Reload)
개발 모드에서는 코드 변경 시 자동으로 익스텐션이 리로드됩니다.

### 디버깅
- Content Script: 페이지에서 F12 > Console
- Background Script: `chrome://extensions` > Inspect views
- Popup: 팝업에서 우클릭 > 검사

## 🚧 다음 단계

- [ ] 실제 AI API 연동 (OpenAI, Claude)
- [ ] DOM 분석기 구현 (CSS 선택자 자동 생성)
- [ ] 사용자 가이드 히스토리 저장
- [ ] 다국어 지원 (영어, 한국어)
- [ ] Chrome Web Store 배포
