import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Model configuration controlled via environment variables
DEFAULT_MODEL_PATH = str(BASE_DIR / "models" / "voiceguard_v1.onnx")
MODEL_PATH = os.environ.get("MODEL_PATH", DEFAULT_MODEL_PATH)
MODEL_VERSION = os.environ.get("MODEL_VERSION", "1.0.0")

# If MODEL_PATH starts with "/models", check relative project path as well
if not os.path.exists(MODEL_PATH):
    alt_path = str(BASE_DIR / MODEL_PATH.lstrip("/"))
    if os.path.exists(alt_path):
        MODEL_PATH = alt_path
