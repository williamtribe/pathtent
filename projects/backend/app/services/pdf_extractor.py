import asyncio
from pathlib import Path
from typing import Protocol

import fitz


class PDFTextExtractor(Protocol):
    async def extract_text(self, pdf_path: Path) -> str: ...


class PyMuPDFExtractor:
    async def extract_text(self, pdf_path: Path) -> str:
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        def _extract_sync() -> str:
            doc = fitz.open(pdf_path)
            try:
                text_parts = []
                for page in doc:
                    text_parts.append(page.get_text())
                return "\n".join(text_parts)
            finally:
                doc.close()

        return await asyncio.to_thread(_extract_sync)
