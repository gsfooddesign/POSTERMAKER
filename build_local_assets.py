"""Generate local-file-safe image scripts without changing source PNGs."""
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def build():
    output = ROOT / "local-assets"
    output.mkdir(exist_ok=True)
    for path in (ROOT / "테스트용이미지모음").glob("*.png"):
        if not path.name.startswith(("image_", "head_", "footer_")):
            continue
        data = "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode("ascii")
        script = "window.POSTER_LOCAL_ASSETS = window.POSTER_LOCAL_ASSETS || {};\n"
        script += "window.POSTER_LOCAL_ASSETS[" + json.dumps(path.name) + "] = " + json.dumps(data) + ";\n"
        target = output / (path.name + ".js")
        if not target.exists() or target.read_text(encoding="utf-8") != script:
            target.write_text(script, encoding="utf-8")
    print("Local image scripts updated.")


if __name__ == "__main__":
    build()
