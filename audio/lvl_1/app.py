from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import uuid

from main import run_audio_redaction  # YOU own this

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
    return {"status": "ok", "service": "audio-redaction"}

@app.post("/api/audio/lvl1")
async def redact_audio_lvl1(file: UploadFile = File(...)):
    """
    Level 1 Audio Redaction:
    - Names
    - Organizations
    - Locations
    - Phone / Email / SSN / Card
    """

    if not file.filename.lower().endswith(
        (".wav", ".mp3", ".m4a", ".ogg", ".flac")
    ):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    job_id = str(uuid.uuid4())

    input_path = os.path.join(INPUT_DIR, f"{job_id}_{file.filename}")
    output_path = os.path.join(OUTPUT_DIR, f"{job_id}_redacted.wav")

    # Save uploaded file
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 🔥 CALL YOUR CORE TECH
        run_audio_redaction(
            input_audio=input_path,
            output_audio=output_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return FileResponse(
        output_path,
        media_type="audio/wav",
        filename="redacted.wav"
    )
