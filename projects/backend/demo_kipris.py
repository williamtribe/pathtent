#!/usr/bin/env python3
import asyncio
import os

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency for demo convenience
    load_dotenv = None

import httpx

from kipris import KIPRISAPIError, KIPRISClient, KIPRISResponseParseError, SearchParams


async def main() -> None:
    if load_dotenv:
        load_dotenv()

    service_key = os.getenv("KIPRIS_ACCESS_KEY") or os.getenv("KIPRIS_SERVICE_KEY", "")
    if not service_key:
        raise ValueError(
            "KIPRIS_ACCESS_KEY is missing. Set it in .env or your environment."
        )

    base_url = os.getenv("KIPRIS_BASE_URL")
    pdf_base_url = os.getenv("KIPRIS_PDF_BASE_URL")
    pdf_service_key = os.getenv("KIPRIS_PDF_SERVICE_KEY") or os.getenv("KIPRIS_SERVICE_KEY")
    debug = os.getenv("KIPRIS_DEBUG", "").lower() in {"1", "true", "yes", "on"}
    async with KIPRISClient(
        service_key,
        base_url=base_url,
        pdf_base_url=pdf_base_url,
        pdf_service_key=pdf_service_key,
        debug=debug,
    ) as client:
        # 테스트 1: "센서" 키워드로 검색
        print("=" * 60)
        print("KIPRIS API 시범 호출 테스트")
        print("=" * 60)

        params = SearchParams(word="센서", docs_start=1, docs_count=5)
        print(f"\n검색어: '{params.word}'")
        print(f"요청 건수: {params.docs_count or params.num_of_rows}")
        print("-" * 60)

        try:
            results = await client.search(params)
        except KIPRISAPIError as exc:
            print(f"\n❌ KIPRIS API 오류 발생 ({exc}). 입력값 또는 API 키를 확인해 주세요.")
            return
        except KIPRISResponseParseError as exc:
            print(f"\n❌ KIPRIS 응답 파싱 실패: {exc}")
            return
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code if exc.response else "unknown"
            request_url = exc.request.url if exc.request else "unknown"
            print(
                "\n❌ KIPRIS API 오류 발생 "
                f"(HTTP {status_code}, {request_url}). 잠시 후 다시 시도해 주세요."
            )
            return

        print(f"\n✅ 검색 결과: {len(results)}건")
        print("-" * 60)

        for i, patent in enumerate(results, 1):
            print(f"\n[{i}] {patent.invention_title}")
            print(f"    출원인: {patent.applicant_name}")
            print(f"    출원번호: {patent.application_number}")
            print(f"    출원일: {patent.application_date}")
            print(f"    공개번호: {patent.open_number}")
            print(f"    공개일: {patent.open_date}")
            print(f"    등록상태: {patent.register_status}")
            if patent.ipc_number:
                print(f"    IPC: {patent.ipc_number[:50]}...")

        # 테스트 2: PDF 정보 조회 (첫 번째 결과의 출원번호 사용)
        if results:
            app_no = results[0].application_number
            if app_no:
                print("\n" + "=" * 60)
                print(f"PDF 정보 조회 테스트 (출원번호: {app_no})")
                print("=" * 60)

                if not pdf_service_key:
                    print("❌ KIPRIS_SERVICE_KEY 또는 KIPRIS_PDF_SERVICE_KEY가 없어 PDF 조회를 건너뜁니다.")
                    return

                try:
                    pdf_info = await client.get_publication_pdf_info(app_no)
                except KIPRISAPIError as exc:
                    print(f"❌ 공개 PDF 조회 오류: {exc}")
                    if exc.result_code == "10":
                        print("   → KIPRIS_SERVICE_KEY(PDF용) 값이 맞는지 확인해 주세요.")
                except KIPRISResponseParseError as exc:
                    print(f"❌ 공개 PDF 응답 파싱 실패: {exc}")
                except httpx.HTTPStatusError as exc:
                    status_code = exc.response.status_code if exc.response else "unknown"
                    request_url = exc.request.url if exc.request else "unknown"
                    print(
                        "❌ 공개 PDF 조회 실패 "
                        f"(HTTP {status_code}, {request_url}). 잠시 후 다시 시도해 주세요."
                    )
                else:
                    if pdf_info:
                        print("✅ 공개 PDF 발견!")
                        print(f"   파일명: {pdf_info.doc_name}")
                        print(f"   경로: {pdf_info.path[:80]}...")
                    else:
                        print("❌ 공개 PDF 없음 (아직 공개되지 않았거나 PDF 미생성)")

        print("\n" + "=" * 60)
        print("테스트 완료!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
