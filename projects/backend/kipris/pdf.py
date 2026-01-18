import xml.etree.ElementTree as ET

from kipris.models import PDFInfo

PUBLICATION_PDF_ENDPOINT = "getPubFullTextInfoSearch"
ANNOUNCEMENT_PDF_ENDPOINT = "getAnnFullTextInfoSearch"


def build_pdf_query(
    application_number: str,
    key: str,
    key_param: str,
) -> dict[str, str]:
    return {
        "applicationNumber": application_number,
        key_param: key,
    }


def parse_pdf_info(root: ET.Element) -> PDFInfo | None:
    item = root.find(".//item")

    if item is None:
        return None

    doc_name = item.findtext("docName")
    path = item.findtext("path")

    if not doc_name or not path:
        return None

    return PDFInfo(docName=doc_name, path=path)
