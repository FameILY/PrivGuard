import os
import re
import torch
import whisperx
from transformers import pipeline
from pydub import AudioSegment
from pydub.generators import Sine

# ================= CONFIG ================= #

INPUT_DIR = "input"
OUTPUT_DIR = "output"

WHISPER_MODEL = "medium"
NER_MODEL = "dslim/bert-base-NER"

NER_LABELS = {"PER", "ORG", "LOC"}
BEEP_FREQ = 1000
MIN_BEEP_MS = 300

# ========================================= #

os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

device = 0 if torch.cuda.is_available() else -1
torch_device = "cuda" if device == 0 else "cpu"

print(f"🔥 Device: {torch_device}")

# ================= LOAD MODELS ================= #

print("📥 Loading WhisperX model...")
whisper_model = whisperx.load_model(
    WHISPER_MODEL,
    device=torch_device,
    compute_type="float16" if device == 0 else "float32"
)

print("📥 Loading NER model...")
ner = pipeline(
    "ner",
    model=NER_MODEL,
    aggregation_strategy="simple",
    device=device
)

# ================= CORE ================= #

def run_audio_redaction(input_audio: str):
    print(f"\n🎧 Input audio: {input_audio}")

    audio = AudioSegment.from_file(input_audio).set_channels(1)

    # -------- Transcription -------- #
    print("📝 Transcribing...")
    result = whisper_model.transcribe(input_audio)

    language = result.get("language", "en")
    print(f"🌍 Language: {language}")

    # -------- Alignment -------- #
    print("⏱️ Aligning words...")
    align_model, metadata = whisperx.load_align_model(
        language_code=language,
        device=torch_device
    )

    aligned = whisperx.align(
        result["segments"],
        align_model,
        metadata,
        input_audio,
        device=torch_device
    )

    words = aligned["word_segments"]
    print(f"✅ Words detected: {len(words)}")

    # -------- Build transcript with CHAR OFFSETS -------- #
    transcript = ""
    word_meta = []

    for w in words:
        start_char = len(transcript)
        token = w["word"]
        transcript += token + " "
        end_char = len(transcript)

        word_meta.append({
            "word": token,
            "start_char": start_char,
            "end_char": end_char,
            "start_time": w["start"],
            "end_time": w["end"],
        })

    transcript = transcript.strip()

    # -------- NER (CHAR-BASED) -------- #
    print("\n🔍 NER-based PII detection...")
    ner_results = ner(transcript)

    redacted_word_indices = set()
    redaction_intervals = []

    for ent in ner_results:
        if ent["entity_group"] not in NER_LABELS:
            continue

        ent_start = ent["start"]
        ent_end = ent["end"]

        print(f"❌ {ent['word']} | {ent['entity_group']}")

        for i, w in enumerate(word_meta):
            if not (w["end_char"] <= ent_start or w["start_char"] >= ent_end):
                redacted_word_indices.add(i)
                redaction_intervals.append(
                    (w["start_time"], w["end_time"])
                )

    # -------- Regex (PHONE) -------- #
    print("\n🔍 Regex-based PII detection...")
    for match in re.finditer(r"\d{3}[-\s]?\d{3}[-\s]?\d{4}", transcript):
        print(f"❌ {match.group()} | PHONE")
        for i, w in enumerate(word_meta):
            if not (w["end_char"] <= match.start() or w["start_char"] >= match.end()):
                redacted_word_indices.add(i)
                redaction_intervals.append(
                    (w["start_time"], w["end_time"])
                )

    # -------- Merge audio intervals -------- #
    redaction_intervals = sorted(redaction_intervals)
    merged_intervals = []
    for start, end in redaction_intervals:
        if not merged_intervals or start > merged_intervals[-1][1]:
            merged_intervals.append([start, end])
        else:
            merged_intervals[-1][1] = max(merged_intervals[-1][1], end)

    # -------- Build REDACTED TEXT -------- #
    redacted_words = [
        "beep" if i in redacted_word_indices else w["word"]
        for i, w in enumerate(word_meta)
    ]

    redacted_text = " ".join(redacted_words)

    txt_path = os.path.join(OUTPUT_DIR, "redacted.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(redacted_text)

    print(f"\n📄 Redacted text saved → {txt_path}")

    # -------- Audio redaction -------- #
    print("\n🔊 Applying audio redaction...")

    beep = Sine(BEEP_FREQ).to_audio_segment(
        duration=MIN_BEEP_MS,
        volume=-18
    )

    redacted_audio = AudioSegment.empty()
    last_end_ms = 0

    for start, end in merged_intervals:
        start_ms = int(start * 1000)
        end_ms = int(end * 1000)

        redacted_audio += audio[last_end_ms:start_ms]
        duration = max(MIN_BEEP_MS, end_ms - start_ms)
        redacted_audio += beep[:duration].fade_in(10).fade_out(10)
        last_end_ms = end_ms

    redacted_audio += audio[last_end_ms:]

    out_audio_path = os.path.join(OUTPUT_DIR, "redacted.wav")
    redacted_audio.export(out_audio_path, format="wav")

    print(f"\n✅ Redacted audio saved → {out_audio_path}")

# ================= ENTRY ================= #

if __name__ == "__main__":
    audio_files = [
        f for f in os.listdir(INPUT_DIR)
        if f.lower().endswith((".wav", ".mp3", ".m4a", ".flac", ".ogg"))
    ]

    if not audio_files:
        raise RuntimeError("❌ No audio file found in input/")

    run_audio_redaction(os.path.join(INPUT_DIR, audio_files[0]))
