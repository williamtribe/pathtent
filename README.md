# PATHTENT - AI 특허 출원 자동화 시스템

AI 기반 특허 분석 및 출원 자동화 웹 애플리케이션입니다.

## 데모 실행 방법

### 1. 환경 변수 설정

데모를 실행하기 전에 아래 환경 변수를 설정해야 합니다:

```bash
# OpenAI API 키 (필수)
export OPENAI_API_KEY="sk-your-openai-api-key"

# PostgreSQL 데이터베이스 URL (필수)
export DATABASE_URL="postgresql://username:password@host:port/database"
```

**환경 변수 설명:**
- `OPENAI_API_KEY`: [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받은 API 키
- `DATABASE_URL`: PostgreSQL 데이터베이스 연결 문자열 (사용자 인증에 사용)

### 2. 의존성 설치

```bash
cd local-ignore/PATHTENT-demo
pip install -r requirements.txt
```

### 3. 데모 실행

```bash
python main.py
```

실행 후 브라우저에서 표시되는 URL (기본: `http://localhost:7860`)로 접속합니다.

## 주요 기능

| 단계 | 기능 | 설명 |
|------|------|------|
| STEP 1 | 기술 분석 | 아이디어의 기술 구성 요소 분석 |
| STEP 2-1 | 청구항 생성 | 독립항 + 종속항 자동 생성 |
| STEP 2-2 | 명세서 생성 | 전체 특허 명세서 자동 생성 |
| STEP 3 | IPC + 검색식 | IPC 코드 추천 및 특허 검색식 생성 |
| STEP 4 | Claim Chunking | 청구항 의미 단위 분해 분석 |
| STEP 5 | 등록 가능성 | 신규성/진보성/산업상 이용가능성 평가 |
| STEP 6 | 최종 검토 | 출원 전 검토 사항 및 비용 안내 |

## 기술 스택

- **Python 3.13**
- **OpenAI GPT-4o-mini**: AI 분석 엔진
- **Gradio**: 웹 인터페이스
- **PostgreSQL**: 사용자 인증 DB
