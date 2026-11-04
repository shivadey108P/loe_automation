# Idea Vault

Speak a raw idea into your phone or laptop mic. It gets transcribed (Whisper),
cleaned up into a title + tags + structured summary (GPT-4o-mini), and saved
to a database — raw and structured versions both kept. Then you can pull it
back up by just asking Claude.

Cost: roughly a few cents to a couple of dollars a month at normal voice-note
volume. Whisper is $0.006/min, GPT-4o-mini is a fraction of a cent per note,
Supabase and Cloudflare are both free at this scale.

## What's in here

```
frontend/index.html   -> the mic-capture page (deploy to Cloudflare Pages)
worker/                -> the backend (deploy to Cloudflare Workers)
supabase/schema.sql    -> run once in your Supabase project
mcp/claude_config_snippet.json -> lets Claude query the DB directly
.env.example           -> copy to .env and fill in your keys
```

## Setup (about 15 minutes)

### 1. Supabase (the database)

1. Go to supabase.com, create a free account and a new project.
2. Open the SQL Editor, paste in `supabase/schema.sql`, run it.
3. Go to Project Settings -> API. Copy:
   - Project URL -> `SUPABASE_URL`
   - `service_role` key (NOT the anon key) -> `SUPABASE_SERVICE_KEY`

### 2. Cloudflare Worker (the backend)

1. Install wrangler if you don't have it: `npm install -g wrangler`
2. `cd worker && wrangler login`
3. Set your secrets (it'll prompt you to paste each one):
   ```
   wrangler secret put OPENAI_API_KEY
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_KEY
   ```
4. Deploy: `wrangler deploy`
5. It prints a URL like `https://idea-capture-worker.<you>.workers.dev` — save that.

### 3. Cloudflare Pages (the frontend)

Easiest path — drag and drop:
1. Cloudflare dashboard -> Workers & Pages -> Create -> Pages -> Upload assets.
2. Upload the `frontend/` folder.
3. Open the deployed page, paste your Worker URL from step 2 into the
   "Worker URL" field at the top — it's saved in the browser after that.

(If you'd rather connect it to GitHub for auto-deploys on push, push this
whole folder to a repo first, then use "Connect to Git" instead of upload.)

### 4. Connect Claude to the database

1. Get a Supabase personal access token: Supabase dashboard -> Account ->
   Access Tokens -> Generate new token.
2. Open `mcp/claude_config_snippet.json`, fill in your project ref (from
   your Supabase URL) and the access token.
3. Add that `mcpServers` block to your Claude Desktop / Claude Code MCP
   config file.
4. Restart Claude. You can now say things like "show me my last 10 ideas"
   or "pull up anything I tagged fomo" and Claude queries Supabase directly.

## Using it

Open the Pages URL on your phone, tap the mic, talk through the idea like
you're explaining it to a friend. Tap again to stop. It saves automatically
— both what you actually said (raw_text) and the cleaned-up version
(structured_text), so nothing gets lost to over-editing.

## Notes / next steps

- This is a single-user tool — no auth on the Worker. Fine for personal use;
  don't share the Worker URL publicly, since anyone with it could write to
  your DB.
- If you want stricter security later: add a shared-secret header check in
  the Worker, or put it behind Cloudflare Access.
- `status` field on each idea (captured / refined / used / archived) is
  there for you to manage a queue later — e.g. mark an idea "used" once it
  becomes a script.
