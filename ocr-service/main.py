"""Optional PaddleOCR microservice. Install requirements separately; CPU setup may be large."""
from fastapi import FastAPI, UploadFile, File, HTTPException
from paddleocr import PaddleOCR
import tempfile, os
app = FastAPI(title="PayShield OCR Service")
ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
@app.get('/health')
def health(): return {"status":"ok","engine":"PaddleOCR"}
@app.post('/extract')
async def extract(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or '')[1] or '.png'
    data = await file.read()
    if len(data) > 8 * 1024 * 1024: raise HTTPException(413, 'File too large')
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data); path = tmp.name
    try:
        result = ocr.ocr(path, cls=True)
        lines = [row[1][0] for page in (result or []) if page for row in page]
        text = '\n'.join(lines)
        return {"engine":"PaddleOCR","text":text,"lines":lines,"warning":"OCR output is unverified. Confirm against original evidence."}
    finally: os.unlink(path)
