import os
import re
import string
import torch
import whisperx
from transformers import pipeline
from pydub import AudioSegment
from pydub.generators import Sine

# ================= CONFIG ================= #

INPUT_DIR = "input"
OUTPUT_DIR = "output"

WHISPER_MODEL = "medium"
BEEP_FREQ = 1000
MIN_BEEP_MS = 300

NER_MODEL = "dslim/bert-base-NER"
NER_LABELS = {"PER", "ORG", "LOC"}

# ======================================== #

os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

device = 0 if torch.cuda.is_available() else -1
torch_device = "cuda" if device == 0 else "cpu"

print(f"🔥 Device: {torch_device}")

# ================= LOAD MODELS (ONCE) ================= #

print("📥 Loading WhisperX...")
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

# ================= UTILS ================= #

def normalize(text: str) -> str:
    return text.lower().translate(
        str.maketrans("", "", string.punctuation)
    )

# ================= CORE FUNCTION ================= #

def run_audio_redaction(input_audio: str, output_audio: str):
    print(f"🎧 Input audio: {input_audio}")

    if not os.path.exists(input_audio):
        raise RuntimeError(f"❌ Input audio not found: {input_audio}")

    # ================= TRANSCRIPTION ================= #

    print("📝 Transcribing...")
    result = whisper_model.transcribe(input_audio)

    language = result.get("language", "en")
    print(f"🌍 Language: {language}")

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

    # ================= PRINT WORDS (RESTORED) ================= #

    print("\n🎧 WORDS IN AUDIO:\n")
    for w in words:
        print(f"[{w['start']:.2f}s - {w['end']:.2f}s] {w['word']}")

    # ================= NORMALIZATION ================= #

    norm_words = [
        {
            "word": normalize(w["word"]),
            "start": w["start"],
            "end": w["end"]
        }
        for w in words
    ]

    full_text = " ".join(w["word"] for w in norm_words)

    # ================= MATCHING ================= #

    def find_timing(text):
        tokens = normalize(text).split()
        for i in range(len(norm_words)):
            seq = []
            for j in range(i, min(i + len(tokens) + 2, len(norm_words))):
                seq.append(norm_words[j]["word"])
                if seq == tokens:
                    return norm_words[i]["start"], norm_words[j]["end"]
        return None

    redaction_intervals = []

    # ================= NER ================= #

    print("\n🔍 NER-based PII detection...")
    for ent in ner(" ".join(w["word"] for w in words)):
        if ent["entity_group"] in NER_LABELS:
            timing = find_timing(ent["word"])
            if timing:
                redaction_intervals.append(timing)
                print(f"❌ {ent['word']} | {ent['entity_group']}")

    # ================= REGEX ================= #

    print("\n🔍 Regex-based PII detection...")

    REGEX_PATTERNS = {
        "PHONE": r"\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b",
        "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
        "CREDIT_CARD": r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
    }

    for label, pattern in REGEX_PATTERNS.items():
        for match in re.finditer(pattern, full_text):
            timing = find_timing(match.group())
            if timing:
                redaction_intervals.append(timing)
                print(f"❌ {match.group()} | {label}")

    # ================= AUDIO REDACTION ================= #

    print("\n🔊 Applying audio redaction...")

    audio = AudioSegment.from_file(input_audio).set_channels(1)

    beep = Sine(BEEP_FREQ).to_audio_segment(
        duration=MIN_BEEP_MS,
        volume=-18
    )

    redacted = AudioSegment.empty()
    last_end_ms = 0

    for start, end in sorted(redaction_intervals):
        start_ms = int(start * 1000)
        end_ms = int(end * 1000)

        redacted += audio[last_end_ms:start_ms]

        duration = max(MIN_BEEP_MS, end_ms - start_ms)
        redacted += beep[:duration].fade_in(10).fade_out(10)

        last_end_ms = end_ms

    redacted += audio[last_end_ms:]

    os.makedirs(os.path.dirname(output_audio), exist_ok=True)
    redacted.export(output_audio, format="wav")

    print(f"\n✅ REDACTED AUDIO SAVED → {output_audio}")
    return output_audio

# ================= CLI DEMO (RESTORED) ================= #

if __name__ == "__main__":
    audio_files = [
        f for f in os.listdir(INPUT_DIR)
        if f.lower().endswith((".wav", ".mp3", ".ogg", ".m4a", ".flac"))
    ]

    if not audio_files:
        raise RuntimeError("❌ No audio file found in input/")

    input_audio = os.path.join(INPUT_DIR, audio_files[0])
    output_audio = os.path.join(OUTPUT_DIR, "redacted.wav")

    run_audio_redaction(input_audio, output_audio)
