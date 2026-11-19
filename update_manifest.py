from __future__ import annotations

import json
import os
import shutil
import argparse
import hashlib
import re
from pathlib import Path
from build_local_assets import build as build_local_assets


ROOT = Path(__file__).resolve().parent
ASSET_DIR = ROOT / "테스트용이미지모음"
MANIFEST_JSON = ROOT / "manifest.json"
MANIFEST_JS = ROOT / "manifest.js"


def collect(prefix: str) -> list[str]:
    return sorted(path.name for path in ASSET_DIR.glob(f"{prefix}_*.png"))


def build_manifest() -> dict:
    return {
        "canvas": {
            "width": 1684,
            "height": 2382,
            "printWidth": 3508,
            "printHeight": 4961,
        },
        "assetBase": "테스트용이미지모음/",
        "heads": collect("head"),
        "images": collect("image"),
        "prices": ["__none__", *collect("price")],
        "footers": collect("footer"),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--web', action='store_true')
    args = parser.parse_args()
    if not args.web:
        build_local_assets()
    manifest = build_manifest()
    text = json.dumps(manifest, ensure_ascii=False, indent=2)

    json_tmp = MANIFEST_JSON.with_suffix(".json.tmp")
    js_tmp = MANIFEST_JS.with_suffix(".js.tmp")
    json_tmp.write_text(text + "\n", encoding="utf-8")
    js_tmp.write_text(f"window.POSTER_MANIFEST = {text};\n", encoding="utf-8")
    try:
        os.replace(json_tmp, MANIFEST_JSON)
        os.replace(js_tmp, MANIFEST_JS)
    except PermissionError:
        generated_json = ROOT / "manifest.generated.json"
        generated_js = ROOT / "manifest.generated.js"
        generated_json.unlink(missing_ok=True)
        generated_js.unlink(missing_ok=True)
        shutil.move(json_tmp, generated_json)
        shutil.move(js_tmp, generated_js)
        print("manifest files are locked by Windows or OneDrive.")
        print(f"generated instead: {generated_json.name}, {generated_js.name}")
        print("Close the app/browser sync preview, then rename the generated files if needed.")
        return

    digest = hashlib.sha256(text.encode('utf-8'))
    for group in ('heads', 'images', 'footers'):
        for name in manifest[group]:
            digest.update((ASSET_DIR / name).read_bytes())
    worker = ROOT / 'service-worker.js'
    source = worker.read_text(encoding='utf-8')
    source = re.sub(r'const CACHE_NAME = "[^"]+";',
                    'const CACHE_NAME = "siniju-a3-' + digest.hexdigest()[:16] + '";', source, count=1)
    worker.write_text(source, encoding='utf-8')
    print(f"updated: {MANIFEST_JSON.name}, {MANIFEST_JS.name}")


if __name__ == "__main__":
    main()
