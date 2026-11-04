import os

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
# Publishable/anon key: used only to validate user tokens (least privilege).
SUPABASE_PUBLISHABLE_KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]

STRUCTURING_MODEL = os.environ.get("STRUCTURING_MODEL", "gpt-4o-mini")
STRUCTURING_TEMPERATURE = 0.4
WHISPER_MODEL = "whisper-1"
OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions"

# Comma-separated list of emails allowed to use the API (single-user tool).
ALLOWED_EMAILS = {e.strip().lower() for e in os.environ["ALLOWED_EMAILS"].split(",") if e.strip()}
# Comma-separated list of browser origins allowed by CORS.
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
