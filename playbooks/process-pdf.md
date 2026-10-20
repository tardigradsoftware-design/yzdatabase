# Playbook: Extract text/tables from a PDF or document

**When:** the user gives a PDF/office file and wants its content.

**Tools:** `PyMuPDF` (fast text/images), `pdfplumber` (tables), `markitdown` (file → Markdown), `unstructured` (many formats), OCR: `PaddleOCR` / `tesseract`.

**Steps**
1. Digital PDF with selectable text → `PyMuPDF` (`pip install pymupdf`) or `pdfplumber` for tables.
2. Mixed office files (docx, pptx, html) → `markitdown` or `unstructured` to normalize to Markdown/text.
3. Scanned images / no text layer → OCR with `PaddleOCR` or `tesseract` first, then step 1.
4. Feed the extracted text to your model, or index it with the RAG playbook.
