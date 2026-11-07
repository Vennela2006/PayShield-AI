"""PayShield AI OCR microservice supporting images and PDFs."""

import os
import tempfile

import fitz
from fastapi import FastAPI, UploadFile, File, HTTPException
from paddleocr import PaddleOCR

app = FastAPI(title="PayShield OCR Service")

MAX_FILE_SIZE = 8 * 1024 * 1024
MAX_PDF_PAGES = 10
MIN_TEXT_LENGTH = 15

ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)


@app.get("/health")
def health():
    return {"status": "ok", "engine": "PaddleOCR"}


def extract_image_text(path: str):
    result = ocr.ocr(path, cls=True)
    lines = [
        row[1][0]
        for page in (result or [])
        if page
        for row in page
    ]
    return lines


def extract_pdf_text(path: str):
    document = fitz.open(path)

    try:
        if document.page_count > MAX_PDF_PAGES:
            raise HTTPException(
                status_code=413,
                detail=f"PDF cannot exceed {MAX_PDF_PAGES} pages."
            )

        all_lines = []

        for page_number, page in enumerate(document):
            embedded_text = page.get_text("text").strip()

            if len(embedded_text) >= MIN_TEXT_LENGTH:
                page_lines = [
                    line.strip()
                    for line in embedded_text.splitlines()
                    if line.strip()
                ]
                all_lines.extend(page_lines)
            else:
                pixmap = page.get_pixmap(
                    matrix=fitz.Matrix(2, 2),
                    alpha=False
                )

                image_bytes = pixmap.tobytes("png")

                with tempfile.NamedTemporaryFile(
                    suffix=".png",
                    delete=False
                ) as image_file:
                    image_file.write(image_bytes)
                    image_path = image_file.name

                try:
                    all_lines.extend(extract_image_text(image_path))
                finally:
                    if os.path.exists(image_path):
                        os.unlink(image_path)

        return all_lines

    finally:
        document.close()


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    filename = file.filename or ""
    suffix = os.path.splitext(filename)[1].lower()

    if suffix not in {".png", ".jpg", ".jpeg", ".pdf"}:
        raise HTTPException(
            status_code=415,
            detail="Supported formats: PNG, JPG, JPEG and PDF."
        )

    data = await file.read()

    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 8 MB.")

    with tempfile.NamedTemporaryFile(
        suffix=suffix,
        delete=False
    ) as tmp:
        tmp.write(data)
        path = tmp.name

    try:
        if suffix == ".pdf":
            lines = extract_pdf_text(path)
            engine = "PyMuPDF + PaddleOCR"
        else:
            lines = extract_image_text(path)
            engine = "PaddleOCR"

        text = "\n".join(lines)

        return {
            "engine": engine,
            "text": text,
            "lines": lines,
            "warning": (
                "Extracted text is unverified. "
                "Confirm every field against the original evidence."
            )
        }

    finally:
        if os.path.exists(path):
            os.unlink(path)
