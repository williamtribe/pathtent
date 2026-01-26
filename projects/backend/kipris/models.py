from typing import Literal

from pydantic import BaseModel, Field


class SearchParams(BaseModel):
    word: str | None = Field(None, alias="word")
    invention_title: str | None = Field(None, alias="inventionTitle")
    abstract_content: str | None = Field(None, alias="astrtCont")
    claim_scope: str | None = Field(None, alias="claimScope")
    ipc_number: str | None = Field(None, alias="ipcNumber")
    application_number: str | None = Field(None, alias="applicationNumber")
    open_number: str | None = Field(None, alias="openNumber")
    publication_number: str | None = Field(None, alias="publicationNumber")
    register_number: str | None = Field(None, alias="registerNumber")
    priority_application_number: str | None = Field(
        None, alias="priorityApplicationNumber"
    )
    international_application_number: str | None = Field(
        None, alias="internationalApplicationNumber"
    )
    international_open_number: str | None = Field(None, alias="internationOpenNumber")
    application_date: str | None = Field(None, alias="applicationDate")
    open_date: str | None = Field(None, alias="openDate")
    publication_date: str | None = Field(None, alias="publicationDate")
    register_date: str | None = Field(None, alias="registerDate")
    priority_application_date: str | None = Field(None, alias="priorityApplicationDate")
    international_application_date: str | None = Field(
        None, alias="internationalApplicationDate"
    )
    international_open_date: str | None = Field(None, alias="internationOpenDate")
    applicant: str | None = Field(None, alias="applicant")
    inventors: str | None = Field(None, alias="inventors")
    agent: str | None = Field(None, alias="agent")
    right_holder: str | None = Field(None, alias="rightHoler")
    patent: bool | None = Field(None, alias="patent")
    utility: bool | None = Field(None, alias="utility")
    last_value: Literal["", "A", "C", "F", "G", "I", "J", "R"] | None = Field(
        None, alias="lastvalue"
    )
    page_no: int | None = Field(None, alias="pageNo")
    num_of_rows: int | None = Field(None, alias="numOfRows")
    sort_spec: Literal["PD", "AD", "GD", "OPD", "FD", "FOD", "RD"] | None = Field(
        None, alias="sortSpec"
    )
    desc_sort: bool | None = Field(None, alias="descSort")

    model_config = {"populate_by_name": True}


class PatentSearchResult(BaseModel):
    index_no: str | None = Field(None, alias="indexNo")
    register_status: str | None = Field(None, alias="registerStatus")
    invention_title: str | None = Field(None, alias="inventionTitle")
    ipc_number: str | None = Field(None, alias="ipcNumber")
    register_number: str | None = Field(None, alias="registerNumber")
    register_date: str | None = Field(None, alias="registerDate")
    application_number: str | None = Field(None, alias="applicationNumber")
    application_date: str | None = Field(None, alias="applicationDate")
    open_number: str | None = Field(None, alias="openNumber")
    open_date: str | None = Field(None, alias="openDate")
    publication_number: str | None = Field(None, alias="publicationNumber")
    publication_date: str | None = Field(None, alias="publicationDate")
    abstract_content: str | None = Field(None, alias="astrtCont")
    drawing: str | None = Field(None, alias="drawing")
    big_drawing: str | None = Field(None, alias="bigDrawing")
    applicant_name: str | None = Field(None, alias="applicantName")

    model_config = {"populate_by_name": True}


class PDFInfo(BaseModel):
    doc_name: str = Field(alias="docName")
    path: str = Field(alias="path")

    model_config = {"populate_by_name": True}


class IPCInfo(BaseModel):
    ipc_code: str | None = Field(None, alias="InternationalpatentclassificationNumber")
    ipc_date: str | None = Field(None, alias="InternationalpatentclassificationDate")

    model_config = {"populate_by_name": True}


class IPCSearchParams(BaseModel):
    ipc_number: str = Field(..., alias="ipcNumber")
    docs_start: int = Field(1, alias="docsStart")
    docs_count: int = Field(500, alias="docsCount")
    patent: bool | None = Field(None, alias="patent")
    utility: bool | None = Field(None, alias="utility")
    last_value: Literal["", "A", "C", "F", "G", "I", "J", "R"] | None = Field(
        None, alias="lastvalue"
    )
    sort_spec: Literal["PD", "AD", "GD", "OPD", "FD", "FOD", "RD"] | None = Field(
        None, alias="sortSpec"
    )
    desc_sort: bool | None = Field(None, alias="descSort")

    model_config = {"populate_by_name": True}


class IPCSearchResult(BaseModel):
    applicant: str | None = Field(None, alias="Applicant")
    opening_date: str | None = Field(None, alias="OpeningDate")
    opening_number: str | None = Field(None, alias="OpeningNumber")
    public_number: str | None = Field(None, alias="PublicNumber")
    public_date: str | None = Field(None, alias="PublicDate")
    registration_date: str | None = Field(None, alias="RegistrationDate")
    registration_number: str | None = Field(None, alias="RegistrationNumber")
    registration_status: str | None = Field(None, alias="RegistrationStatus")
    application_date: str | None = Field(None, alias="ApplicationDate")
    application_number: str | None = Field(None, alias="ApplicationNumber")
    abstract: str | None = Field(None, alias="Abstract")
    drawing_path: str | None = Field(None, alias="DrawingPath")
    thumbnail_path: str | None = Field(None, alias="ThumbnailPath")
    serial_number: str | None = Field(None, alias="SerialNumber")
    invention_name: str | None = Field(None, alias="InventionName")
    ipc_number: str | None = Field(
        None, alias="InternationalpatentclassificationNumber"
    )

    model_config = {"populate_by_name": True}


class IPCSearchResponse(BaseModel):
    results: list[IPCSearchResult]
    docs_start: int
    total_count: int


class FreeSearchParams(BaseModel):
    word: str = Field(..., alias="word")
    docs_start: int = Field(1, alias="docsStart")
    docs_count: int = Field(500, alias="docsCount")
    patent: bool | None = Field(None, alias="patent")
    utility: bool | None = Field(None, alias="utility")
    last_value: Literal["", "A", "C", "F", "G", "I", "J", "R"] | None = Field(
        None, alias="lastvalue"
    )
    sort_spec: Literal["PD", "AD", "GD", "OPD", "FD", "FOD", "RD"] | None = Field(
        None, alias="sortSpec"
    )
    desc_sort: bool | None = Field(None, alias="descSort")

    model_config = {"populate_by_name": True}

    def to_query_params(self) -> dict[str, str | int]:
        """Convert to query params with lowercase boolean strings for KIPRIS API."""
        params = self.model_dump(by_alias=True, exclude_none=True)
        # KIPRIS expects lowercase 'true'/'false' for boolean fields
        for key, value in params.items():
            if isinstance(value, bool):
                params[key] = "true" if value else "false"
        return params


class FreeSearchResult(BaseModel):
    """KIPRIS free search result.

    Uses validation_alias for input (PascalCase from KIPRIS API)
    but outputs snake_case field names.
    """

    serial_number: str | None = Field(None, validation_alias="SerialNumber")
    application_number: str | None = Field(None, validation_alias="ApplicationNumber")
    application_date: str | None = Field(None, validation_alias="ApplicationDate")
    opening_number: str | None = Field(None, validation_alias="OpeningNumber")
    opening_date: str | None = Field(None, validation_alias="OpeningDate")
    public_number: str | None = Field(None, validation_alias="PublicNumber")
    public_date: str | None = Field(None, validation_alias="PublicDate")
    registration_number: str | None = Field(None, validation_alias="RegistrationNumber")
    registration_date: str | None = Field(None, validation_alias="RegistrationDate")
    ipc_number: str | None = Field(
        None, validation_alias="InternationalpatentclassificationNumber"
    )
    invention_name: str | None = Field(None, validation_alias="InventionName")
    abstract: str | None = Field(None, validation_alias="Abstract")
    applicant: str | None = Field(None, validation_alias="Applicant")
    drawing_path: str | None = Field(None, validation_alias="DrawingPath")
    thumbnail_path: str | None = Field(None, validation_alias="ThumbnailPath")
    registration_status: str | None = Field(None, validation_alias="RegistrationStatus")

    model_config = {"populate_by_name": True}


class FreeSearchResponse(BaseModel):
    results: list[FreeSearchResult]
    docs_start: int
    total_count: int
