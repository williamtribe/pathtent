import xml.etree.ElementTree as ET

from kipris.models import PatentSearchResult, SearchParams

SEARCH_ENDPOINT = "freeSearchInfo"

_REST_TAG_MAP = {
    "SerialNumber": "indexNo",
    "RegistrationStatus": "registerStatus",
    "InventionName": "inventionTitle",
    "InternationalpatentclassificationNumber": "ipcNumber",
    "ApplicationNumber": "applicationNumber",
    "ApplicationDate": "applicationDate",
    "OpeningNumber": "openNumber",
    "OpeningDate": "openDate",
    "PublicNumber": "publicationNumber",
    "PublicDate": "publicationDate",
    "RegistrationNumber": "registerNumber",
    "RegistrationDate": "registerDate",
    "Abstract": "astrtCont",
    "Applicant": "applicantName",
}


def build_search_query(params: SearchParams, access_key: str) -> dict[str, object]:
    query_params = params.model_dump(by_alias=True, exclude_none=True)
    query_params["accessKey"] = access_key

    if "docsCount" not in query_params and "numOfRows" in query_params:
        query_params["docsCount"] = query_params["numOfRows"]
    if "docsStart" not in query_params and "pageNo" in query_params:
        docs_count = query_params.get("docsCount")
        if isinstance(docs_count, int) and docs_count > 0:
            page_no = query_params["pageNo"]
            if isinstance(page_no, int) and page_no > 0:
                query_params["docsStart"] = (page_no - 1) * docs_count + 1

    return query_params


def parse_search_results(root: ET.Element) -> list[PatentSearchResult]:
    items = root.findall(".//PatentUtilityInfo")
    if not items:
        items = root.findall(".//item")

    if not items:
        return []

    results = []
    for item in items:
        data: dict[str, str | None] = {}
        for field in item:
            field_name = _REST_TAG_MAP.get(field.tag, field.tag)
            data[field_name] = field.text

        results.append(PatentSearchResult(**data))

    return results
