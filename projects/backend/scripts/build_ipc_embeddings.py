#!/usr/bin/env python3
"""
Build IPC embeddings database using Gemini.

Embeds Korean IPC descriptions for semantic search.
Concurrent + robust:
- ~30-40 req/sec
- Retry on network errors
- Checkpoint every 500
- Auto-resume

Usage:
    python scripts/build_ipc_embeddings.py
"""

import asyncio
import json
import os
import time
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).parent.parent / ".env")

EMBEDDING_MODEL = "models/embedding-001"
MAX_CONCURRENT = 30
REQUESTS_PER_SECOND = 45
CHECKPOINT_INTERVAL = 500
MAX_RETRIES = 3
RETRY_DELAY = 5


class RateLimiter:
    def __init__(self, rate: float):
        self.rate = rate
        self.last_time = time.monotonic()
        self.lock = asyncio.Lock()

    async def acquire(self):
        async with self.lock:
            now = time.monotonic()
            min_interval = 1.0 / self.rate
            elapsed = now - self.last_time
            if elapsed < min_interval:
                await asyncio.sleep(min_interval - elapsed)
            self.last_time = time.monotonic()


async def embed_single(
    client: genai.Client,
    idx: int,
    text: str,
    semaphore: asyncio.Semaphore,
    rate_limiter: RateLimiter,
) -> tuple[int, list[float]]:
    """Embed with retry."""
    await rate_limiter.acquire()
    async with semaphore:
        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:

                def _embed():
                    result = client.models.embed_content(
                        model=EMBEDDING_MODEL, contents=text
                    )
                    if result.embeddings and result.embeddings[0].values:
                        return list(result.embeddings[0].values)
                    raise ValueError("Empty embedding")

                return idx, await asyncio.to_thread(_embed)
            except Exception as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))
        raise last_error or ValueError("Failed")


def save_checkpoint(path: str, embeddings: list, codes: list):
    np.savez(
        path,
        embeddings=np.array(embeddings, dtype=np.float32),
        codes=np.array(codes[: len(embeddings)], dtype=object),
    )


async def main():
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not set")
        return

    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "data"
    ipc_json_path = data_dir / "ipc_codes.json"
    output_path = data_dir / "ipc_embeddings.npz"
    checkpoint_path = data_dir / "ipc_embeddings_checkpoint.npz"

    # Load IPC codes
    print(f"Loading {ipc_json_path}...")
    with open(ipc_json_path, encoding="utf-8") as f:
        ipc_data = json.load(f)

    codes = list(ipc_data.keys())
    descriptions = [ipc_data[code]["description"] for code in codes]
    total = len(codes)

    # Check checkpoint
    embeddings: list[list[float]] = []
    start_idx = 0

    if checkpoint_path.exists():
        print(f"Found checkpoint: {checkpoint_path}")
        data = np.load(checkpoint_path, allow_pickle=True)
        embeddings = data["embeddings"].tolist()
        start_idx = len(embeddings)
        print(f"Resuming from {start_idx}/{total}")

    if start_idx >= total:
        print("Already complete!")
        np.savez(
            output_path,
            embeddings=np.array(embeddings, dtype=np.float32),
            codes=np.array(codes, dtype=object),
        )
        if checkpoint_path.exists():
            checkpoint_path.unlink()
        return

    remaining = total - start_idx
    print(f"Total: {total}, Remaining: {remaining}")
    print(f"Rate: {REQUESTS_PER_SECOND}/sec, Concurrent: {MAX_CONCURRENT}")
    print()

    client = genai.Client(api_key=api_key)
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    rate_limiter = RateLimiter(REQUESTS_PER_SECOND)

    start_time = time.time()
    completed = 0
    results_buffer: list[tuple[int, list[float]]] = []

    async def process_with_progress(idx: int, text: str):
        nonlocal completed
        result = await embed_single(client, idx, text, semaphore, rate_limiter)
        completed += 1
        if completed % 100 == 0:
            elapsed = time.time() - start_time
            rate = completed / elapsed if elapsed > 0 else 0
            eta = (remaining - completed) / rate if rate > 0 else 0
            print(
                f"  Progress: {start_idx + completed}/{total} ({(start_idx + completed) / total * 100:.1f}%) - {rate:.1f}/sec - ETA: {eta:.0f}s"
            )
        return result

    # Process in chunks for checkpointing
    chunk_size = CHECKPOINT_INTERVAL

    try:
        for chunk_start in range(start_idx, total, chunk_size):
            chunk_end = min(chunk_start + chunk_size, total)
            chunk_indices = range(chunk_start, chunk_end)

            tasks = [process_with_progress(i, descriptions[i]) for i in chunk_indices]
            chunk_results = await asyncio.gather(*tasks)

            # Sort by index and add to embeddings
            chunk_results_sorted = sorted(chunk_results, key=lambda x: x[0])
            for idx, emb in chunk_results_sorted:
                # Ensure we're adding in order
                while len(embeddings) < idx:
                    embeddings.append([0.0] * 768)  # placeholder (shouldn't happen)
                if len(embeddings) == idx:
                    embeddings.append(emb)
                else:
                    embeddings[idx] = emb

            # Save checkpoint
            print(f"  Checkpoint at {len(embeddings)}...")
            save_checkpoint(str(checkpoint_path), embeddings, codes)

    except KeyboardInterrupt:
        print(f"\n\nInterrupted! Checkpoint saved at {len(embeddings)}")
        return
    except Exception as e:
        print(f"\n\nError: {e}")
        print(f"Checkpoint saved at {len(embeddings)}")
        raise

    # Done
    elapsed = time.time() - start_time
    print(f"\nCompleted in {elapsed:.1f}s ({remaining / elapsed:.1f}/sec)")

    embeddings_array = np.array(embeddings, dtype=np.float32)
    codes_array = np.array(codes, dtype=object)

    print(f"Shape: {embeddings_array.shape}")
    np.savez(output_path, embeddings=embeddings_array, codes=codes_array)
    print(f"Saved: {output_path}")

    mapping_path = str(output_path).replace(".npz", "_mapping.json")
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump({code: idx for idx, code in enumerate(codes)}, f)
    print(f"Saved: {mapping_path}")

    if checkpoint_path.exists():
        checkpoint_path.unlink()
        print("Removed checkpoint")


if __name__ == "__main__":
    asyncio.run(main())
