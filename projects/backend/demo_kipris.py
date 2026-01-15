#!/usr/bin/env python3
import asyncio

from kipris import KIPRISClient, SearchParams


async def main() -> None:
    service_key = ""

    async with KIPRISClient(service_key) as client:
        # 테스트 1: "센서" 키워드로 검색
        print("=" * 60)
        print("KIPRIS API 시범 호출 테스트")
        print("=" * 60)

        params = SearchParams(word="센서", num_of_rows=5)
        print(f"\n검색어: '{params.word}'")
        print(f"요청 건수: {params.num_of_rows}")
        print("-" * 60)

        results = await client.search(params)

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

                pdf_info = await client.get_publication_pdf_info(app_no)
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
