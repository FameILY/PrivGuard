from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import uuid

from main import run_audio_redaction  # your core pipeline

INPUT_DIR = "input"
OUTPUT_DIR = "output"

os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(
    title="PrivGuard Audio Redaction API",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "audio-redaction",
        "level": "lvl1"
    }

@app.post("/api/audio/lvl1")
async def redact_audio_lvl1(file: UploadFile = File(...)):
    """
    Level 1 Audio Redaction:
    - PERSON
    - ORG
    - LOC
    - PHONE
    """

    if not file.filename.lower().endswith(
        (".wav", ".mp3", ".m4a", ".ogg", ".flac")
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format"
        )

    job_id = str(uuid.uuid4())

    input_path = os.path.join(
        INPUT_DIR, f"{job_id}_{file.filename}"
    )

    # Save uploaded file
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 🔥 CORE PIPELINE
        run_audio_redaction(input_path=input_path, output_path=os.path.join(OUTPUT_DIR, "redacted.wav"), mode="beep")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    # Core always writes here
    output_audio_path = os.path.join(
        OUTPUT_DIR, "redacted.wav"
    )

    if not os.path.exists(output_audio_path):
        raise HTTPException(
            status_code=500,
            detail="Redacted audio not generated"
        )

    return FileResponse(
        output_audio_path,
        media_type="audio/wav",
        filename="redacted.wav"
    )

@app.post("/api/audio/lvl2")
async def redact_audio_lvl2(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".wav", ".mp3", ".m4a", ".ogg", ".flac")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    job_id = str(uuid.uuid4())
    input_path = os.path.join(INPUT_DIR, f"{job_id}_{file.filename}")

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        run_audio_redaction(input_path=input_path, output_path=os.path.join(OUTPUT_DIR, "redacted_silent.wav"), mode="silence")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    output_audio_path = os.path.join(OUTPUT_DIR, "redacted_silent.wav")

    if not os.path.exists(output_audio_path):
        raise HTTPException(status_code=500, detail="Redacted audio not generated")

    return FileResponse(output_audio_path, media_type="audio/wav", filename="redacted_silent.wav")