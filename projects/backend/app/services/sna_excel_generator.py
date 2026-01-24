from io import BytesIO

import xlsxwriter

from kipris.models import IPCSearchResult, FreeSearchResult


def generate_sna_excel(
    results: list[IPCSearchResult] | list[FreeSearchResult],
) -> BytesIO:
    buffer = BytesIO()
    wb = xlsxwriter.Workbook(buffer, {"in_memory": True})
    ws = wb.add_worksheet("SNA Data")

    headers = [
        "출원번호",
        "발명명칭",
        "출원인",
        "출원일",
        "등록상태",
        "초록",
        "Original IPC Main",
        "Original IPC All",
        "WINTELIPS KEY",
    ]
    for col, header in enumerate(headers):
        ws.write(0, col, header)

    for row_idx, result in enumerate(results, start=1):
        application_number = result.application_number or ""
        ipc_all = result.ipc_number or ""

        ipc_codes = [code.strip() for code in ipc_all.split("|") if code.strip()]
        ipc_main = ipc_codes[0] if ipc_codes else ""

        invention_name = getattr(result, "invention_name", "") or ""
        applicant = getattr(result, "applicant", "") or ""
        application_date = getattr(result, "application_date", "") or ""
        registration_status = getattr(result, "registration_status", "") or ""
        abstract = getattr(result, "abstract", "") or ""

        # Truncate abstract if too long
        if len(abstract) > 500:
            abstract = abstract[:500] + "..."

        ws.write(row_idx, 0, application_number)
        ws.write(row_idx, 1, invention_name)
        ws.write(row_idx, 2, applicant)
        ws.write(row_idx, 3, application_date)
        ws.write(row_idx, 4, registration_status)
        ws.write(row_idx, 5, abstract)
        ws.write(row_idx, 6, ipc_main)
        ws.write(row_idx, 7, ipc_all)
        ws.write(row_idx, 8, "")

    ws.set_column(0, 0, 15)  # 출원번호
    ws.set_column(1, 1, 40)  # 발명명칭
    ws.set_column(2, 2, 20)  # 출원인
    ws.set_column(3, 3, 12)  # 출원일
    ws.set_column(4, 4, 10)  # 등록상태
    ws.set_column(5, 5, 60)  # 초록
    ws.set_column(6, 6, 15)  # IPC Main
    ws.set_column(7, 7, 30)  # IPC All
    ws.set_column(8, 8, 15)  # WINTELIPS KEY

    wb.close()
    buffer.seek(0)

    return buffer
