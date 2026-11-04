import os

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

STRUCTURING_MODEL = os.environ.get("STRUCTURING_MODEL", "gpt-4o-mini")
STRUCTURING_TEMPERATURE = 0.4
WHISPER_MODEL = "whisper-1"
OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions"
