# Audio Redaction Pro

Advanced audio redaction system combining WhisperX's accurate transcription with multi-layer PII detection.

## Features

- 🎯 **WhisperX Transcription**: Word-level timestamps with millisecond accuracy
- 🔍 **Multi-Layer PII Detection**:
  - Transformer-based NER (spaCy + BERT)
  - Regex patterns for phones, emails, SSNs, credit cards
  - Custom banned word lists
- 🔊 **Smart Audio Processing**:
  - Interval merging for natural-sounding redaction
  - Configurable beep frequency and duration
  - Fade in/out to prevent audio clicks
- 📊 **Detailed Reports**: JSON output with all redacted segments

## Installation

### Prerequisites
- Python 3.8+
- FFmpeg

#### Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### Setup

```bash
chmod +x setup.sh
./setup.sh
```

Or manually:
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_trf
```

## Usage

### Basic Usage

```bash
python src/main.py --input input/audio.wav --output output/redacted.wav
```

### Advanced Options

```bash
python src/main.py \
  --input input/audio.wav \
  --output output/redacted.wav \
  --model large-v2 \
  --language en \
  --banned-words "custom,bad,words" \
  --beep-frequency 1000 \
  --min-beep-duration 300 \
  --merge-gap 30 \
  --save-transcript \
  --verbose
```

### All Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--input`, `-i` | Input audio file path | Required |
| `--output`, `-o` | Output redacted audio path | Required |
| `--model`, `-m` | WhisperX model (tiny/base/small/medium/large-v2) | `base` |
| `--language`, `-l` | Language code (en/es/fr/etc) | Auto-detect |
| `--banned-words` | Comma-separated banned words | Built-in list |
| `--pii-types` | PII types to redact (PERSON,ORG,etc) | All types |
| `--beep-frequency` | Beep tone in Hz | 1000 |
| `--min-beep-duration` | Minimum beep length in ms | 300 |
| `--merge-gap` | Gap to merge intervals (ms) | 30 |
| `--use-silence` | Use silence instead of beep | False |
| `--save-transcript` | Save full transcript JSON | False |
| `--verbose`, `-v` | Detailed output | False |

## PII Detection Types

### NER-Based Detection
- **PERSON**: Names of individuals
- **ORG**: Organization names
- **GPE**: Geographic locations (cities, countries)
- **DATE**: Date mentions
- **TIME**: Time mentions
- **MONEY**: Monetary amounts
- **CARDINAL**: Numbers that could be sensitive

### Regex-Based Detection
- **PHONE**: Phone numbers (multiple formats)
  - `555-123-4567`
  - `(555) 123-4567`
  - `5551234567`
- **EMAIL**: Email addresses
- **SSN**: Social Security Numbers (`123-45-6789`)
- **CREDIT_CARD**: Credit card numbers
- **ZIP**: ZIP codes

### Custom Banned Words
Configure your own list of words to redact.

## Examples

### Example 1: Redact interview with custom banned words
```bash
python src/main.py \
  --input input/interview.mp3 \
  --output output/interview_clean.mp3 \
  --model medium \
  --banned-words "confidential,secret,proprietary"
```

### Example 2: Redact only phone numbers and names
```bash
python src/main.py \
  --input input/call.wav \
  --output output/call_redacted.wav \
  --pii-types PERSON,PHONE
```

### Example 3: Use silence instead of beeps
```bash
python src/main.py \
  --input input/podcast.m4a \
  --output output/podcast_clean.mp3 \
  --use-silence
```

### Example 4: Fast processing with small model
```bash
python src/main.py \
  --input input/meeting.wav \
  --output output/meeting_redacted.wav \
  --model tiny
```

## Output Files

After processing, you'll get:

1. **Redacted audio**: `output/redacted.wav`
2. **Redaction report**: `output/redacted_report.json`
3. **Transcript** (optional): `output/redacted_transcript.json`

### Sample Report

```json
{
  "input_file": "input/audio.wav",
  "output_file": "output/redacted.wav",
  "model": "base",
  "language": "en",
  "total_pii_instances": 15,
  "redacted_segments": [
    {
      "text": "John Smith",
      "entity_type": "PERSON",
      "start": 2.45,
      "end": 3.12
    }
  ]
}
```

## Project Structure

```
audio-redaction-pro/
├── src/
│   ├── main.py              # CLI entry point
│   ├── transcriber.py       # WhisperX transcription
│   ├── pii_detector.py      # Multi-layer PII detection
│   ├── audio_processor.py   # Audio redaction engine
│   └── utils.py             # Utilities
├── input/                   # Input audio files
├── output/                  # Redacted outputs
├── requirements.txt         # Python dependencies
├── setup.sh                # Setup script
└── README.md               # Documentation
```

## Performance Notes

### Model Selection
- **tiny**: Fastest (~1x realtime), less accurate
- **base**: Good balance (~2x realtime)
- **small**: Better accuracy (~3x realtime)
- **medium**: High accuracy (~5x realtime)
- **large-v2**: Best accuracy (~10x realtime)

### GPU Acceleration
- Automatically uses CUDA if available
- 5-10x faster with GPU

### Memory Usage
- tiny: ~1GB RAM
- base: ~1.5GB RAM
- medium: ~5GB RAM
- large-v2: ~10GB RAM

## Troubleshooting

### "No module named 'whisperx'"
```bash
pip install whisperx
```

### "FFmpeg not found"
Install FFmpeg (see Prerequisites section)

### Out of memory
Use a smaller model:
```bash
python src/main.py --input audio.wav --output out.wav --model tiny
```

### Inaccurate timestamps
Use a larger model or ensure audio quality is good

## Advanced Configuration

### Custom Banned Words File

Create `banned_words.txt`:
```
confidential
proprietary
secret
internal
```

Use it:
```bash
python src/main.py -i audio.wav -o out.wav --banned-words-file banned_words.txt
```

## License

MIT License

## Contributing

Contributions welcome! Please submit pull requests or open issues.
