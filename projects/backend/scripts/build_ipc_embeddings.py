#!/usr/bin/env python3
"""
Build IPC embeddings database using Gemini (BATCH mode).

- 100 items per batch
- 40 req/sec rate limit
- Checkpoint every 10 batches
- Graceful Ctrl+C handling

Usage:
    uv run python scripts/build_ipc_embeddings.py
"""

import json
import os
import signal
import sys
import time
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).parent.parent / ".env")

EMBEDDING_MODEL = os.environ.get("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
BATCH_SIZE = 100  # Gemini max
RATE_LIMIT = 40  # req/sec
CHECKPOINT_INTERVAL = 10  # batches

# Global for signal handler
_checkpoint_data = {"embeddings": [], "codes": [], "path": None}
_interrupted = False


def _signal_handler(signum, frame):
    global _interrupted
    print("\n\nInterrupted! Saving checkpoint...")
    _interrupted = True


def main():
    global _checkpoint_data

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not set")
        return

    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "data"
    ipc_json_path = data_dir / "ipc_codes.json"
    output_path = data_dir / "ipc_embeddings.npz"
    checkpoint_path = data_dir / "ipc_embeddings_checkpoint.npz"

    _checkpoint_data["path"] = checkpoint_path

    # Load IPC codes
    print(f"Loading {ipc_json_path}...")
    with open(ipc_json_path, encoding="utf-8") as f:
        ipc_data = json.load(f)

    codes = list(ipc_data.keys())
    descriptions = [ipc_data[code]["description"] for code in codes]
    total = len(codes)
    _checkpoint_data["codes"] = codes

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
        _save_final(output_path, embeddings, codes)
        if checkpoint_path.exists():
            checkpoint_path.unlink()
        return

    _checkpoint_data["embeddings"] = embeddings

    remaining = total - start_idx
    num_batches = (remaining + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Model: {EMBEDDING_MODEL}")
    print(f"Total: {total}, Remaining: {remaining}")
    print(f"Batches: {num_batches} x {BATCH_SIZE} items")
    print(f"Rate: {RATE_LIMIT}/sec, ETA: ~{num_batches / RATE_LIMIT:.1f}s (optimistic)")
    print()

    # Setup signal handler
    signal.signal(signal.SIGINT, _signal_handler)

    client = genai.Client(api_key=api_key)
    interval = 1.0 / RATE_LIMIT
    start_time = time.time()
    batch_count = 0

    for batch_start in range(start_idx, total, BATCH_SIZE):
        if _interrupted:
            break

        batch_end = min(batch_start + BATCH_SIZE, total)
        batch_texts = descriptions[batch_start:batch_end]

        # Rate limiting
        time.sleep(interval)

        # Batch embed
        try:
            batch_embs = _embed_batch_sync(client, batch_texts)
        except Exception as e:
            print(f"\n\nFATAL: Failed at batch {batch_start}-{batch_end}: {e}")
            print(f"Saving checkpoint at {len(embeddings)}...")
            _save_checkpoint(checkpoint_path, embeddings, codes)
            raise

        # Validate batch size
        if len(batch_embs) != len(batch_texts):
            print(
                f"\n\nFATAL: Batch size mismatch: {len(batch_embs)} vs {len(batch_texts)}"
            )
            _save_checkpoint(checkpoint_path, embeddings, codes)
            raise ValueError("Batch size mismatch")

        embeddings.extend(batch_embs)
        _checkpoint_data["embeddings"] = embeddings
        batch_count += 1

        # Progress
        elapsed = time.time() - start_time
        rate = batch_count / elapsed if elapsed > 0 else 0
        eta = (num_batches - batch_count) / rate if rate > 0 else 0
        pct = len(embeddings) / total * 100
        print(
            f"  {len(embeddings)}/{total} ({pct:.1f}%) - {rate:.2f} batch/sec - ETA: {eta:.0f}s"
        )

        # Checkpoint
        if batch_count % CHECKPOINT_INTERVAL == 0:
            print(f"  [Checkpoint at {len(embeddings)}]")
            _save_checkpoint(checkpoint_path, embeddings, codes)

    # Final save
    if _interrupted:
        print(f"Saving checkpoint at {len(embeddings)}...")
        _save_checkpoint(checkpoint_path, embeddings, codes)
        print("Exiting. Run again to resume.")
        sys.exit(0)

    # Done
    elapsed = time.time() - start_time
    print(f"\nCompleted in {elapsed:.1f}s ({batch_count / elapsed:.2f} batch/sec)")

    _save_final(output_path, embeddings, codes)

    if checkpoint_path.exists():
        checkpoint_path.unlink()
        print("Removed checkpoint")


def _embed_batch_sync(client: genai.Client, texts: list[str]) -> list[list[float]]:
    """Synchronous batch embedding. Raises on any error."""
    result = client.models.embed_content(model=EMBEDDING_MODEL, contents=texts)

    if not result.embeddings:
        raise ValueError(f"Empty embeddings for batch of {len(texts)}")

    if len(result.embeddings) != len(texts):
        raise ValueError(
            f"Embedding count mismatch: {len(result.embeddings)} vs {len(texts)}"
        )

    embeddings = []
    for i, emb in enumerate(result.embeddings):
        if not emb.values:
            raise ValueError(f"Empty embedding at index {i}")
        embeddings.append(list(emb.values))

    return embeddings


def _save_checkpoint(path: Path, embeddings: list, codes: list):
    np.savez(
        str(path),
        embeddings=np.array(embeddings, dtype=np.float32),
        codes=np.array(codes[: len(embeddings)], dtype=object),
    )


def _save_final(output_path: Path, embeddings: list, codes: list):
    embeddings_array = np.array(embeddings, dtype=np.float32)
    codes_array = np.array(codes, dtype=object)

    print(f"Shape: {embeddings_array.shape}")
    np.savez(output_path, embeddings=embeddings_array, codes=codes_array)
    print(f"Saved: {output_path}")

    mapping_path = str(output_path).replace(".npz", "_mapping.json")
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump({code: idx for idx, code in enumerate(codes)}, f)
    print(f"Saved: {mapping_path}")


if __name__ == "__main__":
    main()
