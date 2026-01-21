import tempfile
from pathlib import Path

import pytest
from app.services.pdf_extractor import PyMuPDFExtractor
from reportlab.pdfgen import canvas

pytestmark = [pytest.mark.asyncio]


async def test_pdf_extractor__if_valid_pdf__extracts_text() -> None:
    # given
    extractor = PyMuPDFExtractor()
    pdf_path = Path(__file__).parent.parent / "fixtures" / "sample.pdf"

    # when
    text = await extractor.extract_text(pdf_path)

    # then
    assert text is not None
    assert len(text) > 0
    assert "Patent Document Sample" in text
    assert "This is a test PDF for text extraction" in text


async def test_pdf_extractor__if_korean_text__extracts_correctly() -> None:
    # given
    extractor = PyMuPDFExtractor()
    pdf_path = Path(__file__).parent.parent / "fixtures" / "sample.pdf"

    # when
    text = await extractor.extract_text(pdf_path)

    # then
    assert "특허" in text
    assert "청구범위" in text
    assert "발명의 명칭" in text
    assert "테스트 특허" in text


async def test_pdf_extractor__if_multi_page__extracts_all_pages() -> None:
    # given
    extractor = PyMuPDFExtractor()
    pdf_path = Path(__file__).parent.parent / "fixtures" / "sample.pdf"

    # when
    text = await extractor.extract_text(pdf_path)

    # then
    assert "Patent Document Sample" in text
    assert "Page 2 - Additional Content" in text
    assert "추가 내용이 포함된 두 번째 페이지" in text
    assert "Multi-page extraction test" in text


async def test_pdf_extractor__if_file_not_found__raises_error() -> None:
    # given
    extractor = PyMuPDFExtractor()
    pdf_path = Path("/nonexistent/path/to/file.pdf")

    # when/then
    with pytest.raises(FileNotFoundError) as exc_info:
        await extractor.extract_text(pdf_path)

    assert "PDF not found" in str(exc_info.value)


async def test_pdf_extractor__if_empty_pdf__returns_empty_string() -> None:
    # given
    extractor = PyMuPDFExtractor()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        c = canvas.Canvas(str(tmp_path))
        c.showPage()
        c.save()

    try:
        # when
        text = await extractor.extract_text(tmp_path)

        # then
        assert text is not None
        assert len(text.strip()) == 0 or text.strip() == ""
    finally:
        tmp_path.unlink()
