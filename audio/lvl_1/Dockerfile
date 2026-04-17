FROM python:3.10-slim-bullseye

WORKDIR /app

# Layer 1: pip install FIRST - most expensive, changes rarely
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* \
    && curl -L https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0-x86_64.tar.gz \
    | tar -xz -C /usr/local

RUN find /usr/local/lib/python3.10/site-packages/ctranslate2 -name "*.so*" | \
    xargs -I{} patchelf --clear-execstack {}

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    binutils \
    curl \
    && rm -rf /var/lib/apt/lists/*


COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]