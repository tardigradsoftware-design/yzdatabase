# Playbook: Transcribe audio to text (and the reverse)

**When:** the user gives audio/video and wants a transcript, or wants text spoken.

**Tools:** STT `faster-whisper` (fast) / `whisper` / `whisperX` (word timestamps); TTS `coqui TTS` / `OpenVoice`.

**Steps (speech-to-text)**
1. `pip install faster-whisper`.
2. Transcribe: load a model size (`base`/`small`/`medium`) and run it on the audio file.
3. Need per-word timestamps or speaker labels? Use `whisperX`.

**Text-to-speech:** use `coqui TTS` or `OpenVoice` (voice cloning).
