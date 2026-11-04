-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  tags text[] default '{}',
  raw_text text not null,
  structured_text text,
  summary text,
  status text default 'captured',   -- captured | refined | used | archived
  created_at timestamptz default now()
);

create index if not exists ideas_created_at_idx on ideas (created_at desc);
create index if not exists ideas_category_idx on ideas (category);

-- Row Level Security: the Worker writes with the service_role key, which
-- bypasses RLS by design, so this just locks the table down from any
-- other (anon/public) access. Safe default for a single-user tool.
alter table ideas enable row level security;

-- Refinement conversation history per idea: user instructions, LLM
-- reasoning/questions, and proposed (not-yet-applied) edits.
create table if not exists idea_messages (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas(id) on delete cascade,
  role text not null,             -- user | assistant | system
  content text,                   -- user message, or assistant reasoning/question
  proposal jsonb,                 -- assistant-proposed {title,category,tags,structured_text,summary}, if any
  created_at timestamptz default now()
);

create index if not exists idea_messages_idea_id_idx on idea_messages (idea_id, created_at);

alter table idea_messages enable row level security;
