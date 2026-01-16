# PATHTENT - KIPRIS 특허 검색 클라이언트

KIPRIS(특허정보검색서비스) API를 활용한 특허 검색 클라이언트입니다.

## 데모 실행 방법

### 1. API 키 설정

`projects/backend/demo_kipris.py` 파일을 열고 8번째 줄의 `service_key`에 KIPRIS API 서비스 키를 입력합니다:

```python
service_key = "여기에_KIPRIS_서비스키_입력"
```

**KIPRIS API 키 발급:**
- https://plus.kipris.or.kr/portal/data/request/apiFsmtmList.do?menuNo=290005

### 2. 의존성 설치

```bash
cd projects/backend
uv sync
```

### 3. 데모 실행

```bash
uv run python demo_kipris.py
```

## 기술 스택

- **Python 3.13**
- **httpx**: 비동기 HTTP 클라이언트
- **pydantic**: 데이터 모델링
