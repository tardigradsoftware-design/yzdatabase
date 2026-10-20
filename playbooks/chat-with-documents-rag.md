# Playbook: Answer questions over private documents (RAG)

**When:** the user wants answers grounded in their own files/knowledge base.

**Tools:** framework `llama_index` or `haystack`; vector store `chroma` / `qdrant`; parsing `unstructured`.

**Steps**
1. **Parse** documents to text (`unstructured`, or the document-processing playbook for PDFs).
2. **Chunk** the text (e.g. ~500–1000 tokens with overlap).
3. **Embed** chunks and store them in a vector DB (`chroma` is the simplest to start: `pip install chromadb`).
4. At query time, embed the question, **retrieve** the top-k chunks, and put them in the prompt.
5. Answer using only retrieved context; cite the chunks. Evaluate with `ragas` if quality matters.
