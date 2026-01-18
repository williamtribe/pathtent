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
    priority_application_number: str | None = Field(None, alias="priorityApplicationNumber")
    international_application_number: str | None = Field(None, alias="internationalApplicationNumber")
    international_open_number: str | None = Field(None, alias="internationOpenNumber")
    application_date: str | None = Field(None, alias="applicationDate")
    open_date: str | None = Field(None, alias="openDate")
    publication_date: str | None = Field(None, alias="publicationDate")
    register_date: str | None = Field(None, alias="registerDate")
    priority_application_date: str | None = Field(None, alias="priorityApplicationDate")
    international_application_date: str | None = Field(None, alias="internationalApplicationDate")
    international_open_date: str | None = Field(None, alias="internationOpenDate")
    applicant: str | None = Field(None, alias="applicant")
    inventors: str | None = Field(None, alias="inventors")
    agent: str | None = Field(None, alias="agent")
    right_holder: str | None = Field(None, alias="rightHoler")
    patent: bool | None = Field(None, alias="patent")
    utility: bool | None = Field(None, alias="utility")
    last_value: Literal["", "A", "C", "F", "G", "I", "J", "R"] | None = Field(None, alias="lastvalue")
    page_no: int | None = Field(None, alias="pageNo")
    num_of_rows: int | None = Field(None, alias="numOfRows")
    docs_start: int | None = Field(None, alias="docsStart")
    docs_count: int | None = Field(None, alias="docsCount")
    sort_spec: Literal["PD", "AD", "GD", "OPD", "FD", "FOD", "RD"] | None = Field(None, alias="sortSpec")
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
