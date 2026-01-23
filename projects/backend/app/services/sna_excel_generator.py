from io import BytesIO

import xlsxwriter

from kipris.models import IPCSearchResult, FreeSearchResult


def generate_sna_excel(results: list[IPCSearchResult] | list[FreeSearchResult]) -> BytesIO:
    buffer = BytesIO()
    wb = xlsxwriter.Workbook(buffer, {"in_memory": True})
    ws = wb.add_worksheet("SNA Data")

    headers = ["출원번호", "Original IPC Main", "Original IPC All", "WINTELIPS KEY"]
    for col, header in enumerate(headers):
        ws.write(0, col, header)

    for row_idx, result in enumerate(results, start=1):
        application_number = result.application_number or ""
        ipc_all = result.ipc_number or ""

        ipc_codes = [code.strip() for code in ipc_all.split("|") if code.strip()]
        ipc_main = ipc_codes[0] if ipc_codes else ""

        ws.write(row_idx, 0, application_number)
        ws.write(row_idx, 1, ipc_main)
        ws.write(row_idx, 2, ipc_all)
        ws.write(row_idx, 3, "")

    wb.close()
    buffer.seek(0)

    return buffer
