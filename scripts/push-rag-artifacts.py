#!/usr/bin/env python3
"""
Push .md and .puml files to S3 for RAG ingestion.

Usage:
    python3 scripts/push-rag-artifacts.py

Uploads all .md and .puml files under the repo root to:
    s3://expertise-rag-artifacts-239571291755-prod/raw/<repo_name>/

The docs/assets/ folder (third-party PlantUML libraries) is excluded.
"""

import boto3
import glob
import os
import sys

BUCKET = "expertise-rag-artifacts-239571291755-prod"
REPO = "resume"
PREFIX = f"raw/{REPO}/"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Folders to exclude (relative to repo root)
EXCLUDE_DIRS = {
    os.path.join(BASE, "docs", "assets"),
    os.path.join(BASE, "node_modules"),
    os.path.join(BASE, "sam-aws"),
    os.path.join(BASE, ".aws-sam"),
}


def should_exclude(path: str) -> bool:
    return any(path.startswith(excl + os.sep) or path == excl for excl in EXCLUDE_DIRS)


def main():
    s3 = boto3.client("s3")

    files = []
    for pattern in ["**/*.md", "**/*.puml"]:
        files.extend(glob.glob(os.path.join(BASE, pattern), recursive=True))

    to_upload = [f for f in sorted(files) if not should_exclude(f)]
    excluded = len(files) - len(to_upload)

    print(f"Found {len(files)} files ({excluded} excluded), uploading {len(to_upload)}...")

    uploaded = 0
    errors = 0
    for fpath in to_upload:
        rel = os.path.relpath(fpath, BASE)
        key = PREFIX + rel
        ext = os.path.splitext(fpath)[1]
        content_type = "text/markdown" if ext == ".md" else "text/plain"
        try:
            s3.upload_file(
                fpath,
                BUCKET,
                key,
                ExtraArgs={
                    "ContentType": content_type,
                    "ServerSideEncryption": "aws:kms",
                },
            )
            print(f"  OK  {rel}")
            uploaded += 1
        except Exception as e:
            print(f"  ERR {rel}: {e}", file=sys.stderr)
            errors += 1

    print(f"\nDone: {uploaded} uploaded, {errors} errors, {excluded} excluded")
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
