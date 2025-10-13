-- migration: create ai-assisted flashcard tables, constraints, and rl policies
-- purpose: introduce core tables for ai generations, flashcard sources, and accepted flashcards along with strict row-level security
-- affected tables: public.ai_generations, public.ai_generations_acceptance, public.flashcard_sources, public.flashcards
-- considerations: all relations cascade on user deletion, rl policies restrict access to row owners, and indices support chronological listings by user

-- Note: pgcrypto extension is already enabled in supabase/postgres image

-- create table storing raw ai generation outputs and metadata
create table public.ai_generations (
                                       id uuid default gen_random_uuid() primary key,
                                       user_id uuid not null references auth.users (id) on delete cascade,
                                       input_text text not null,
                                       model_name text not null,
                                       generated_proposals jsonb not null default '[]'::jsonb,
                                       generated_count integer not null default 0,
                                       duration_ms integer not null default 0,
                                       created_at timestamptz not null default now(),
                                       constraint ai_generations_generated_proposals_array check (jsonb_typeof(generated_proposals) = 'array'),
                                       constraint ai_generations_generated_count_nonnegative check (generated_count >= 0),
                                       constraint ai_generations_duration_nonnegative check (duration_ms >= 0),
                                       constraint ai_generations_id_user_id_key unique (id, user_id)
);

-- index to accelerate per-user chronological listings of ai generations
create index idx_ai_generations_user_id_created_at on public.ai_generations (user_id, created_at);

-- create table aggregating acceptance metrics for each ai generation
create table public.ai_generations_acceptance (
                                                  ai_generation_id uuid primary key,
                                                  user_id uuid not null references auth.users (id) on delete cascade,
                                                  accepted_count integer not null default 0,
                                                  created_at timestamptz not null default now(),
                                                  constraint ai_generations_acceptance_nonnegative check (accepted_count >= 0),
                                                  constraint ai_generations_acceptance_ai_generation_user_fk foreign key (ai_generation_id, user_id) references public.ai_generations (id, user_id) on delete cascade
);

-- index supporting per-user chronological reporting of acceptance aggregates
create index idx_ai_generations_acceptance_user_id_created_at on public.ai_generations_acceptance (user_id, created_at);

-- create table describing the provenance of each flashcard
create table public.flashcard_sources (
                                          flashcard_source_id uuid default gen_random_uuid() primary key,
                                          user_id uuid not null references auth.users (id) on delete cascade,
                                          source_type text not null,
                                          source_id uuid,
                                          created_at timestamptz not null default now(),
                                          constraint flashcard_sources_source_type_check check (source_type in ('manual', 'ai')),
                                          constraint flashcard_sources_source_presence check (
                                              (source_type = 'manual' and source_id is null) or
                                              (source_type = 'ai' and source_id is not null)
                                              ),
                                          constraint flashcard_sources_ai_source_fk foreign key (source_id, user_id) references public.ai_generations (id, user_id) on delete cascade,
                                          constraint flashcard_sources_id_user_id_key unique (flashcard_source_id, user_id)
);

-- index to speed up retrieving a user's sources by creation time
create index idx_flashcard_sources_user_id_created_at on public.flashcard_sources (user_id, created_at);

-- create table storing only accepted flashcards linked to their provenance
create table public.flashcards (
                                   flashcard_id uuid default gen_random_uuid() primary key,
                                   user_id uuid not null references auth.users (id) on delete cascade,
                                   flashcard_source_id uuid not null,
                                   front text not null,
                                   back text not null,
                                   created_at timestamptz not null default now(),
                                   constraint flashcards_source_fk foreign key (flashcard_source_id, user_id) references public.flashcard_sources (flashcard_source_id, user_id) on delete cascade
);

-- index assisting per-user queries of flashcards ordered by creation time
create index idx_flashcards_user_id_created_at on public.flashcards (user_id, created_at);

-- enable row level security to ensure all access paths are governed by policies
alter table public.ai_generations enable row level security;
alter table public.ai_generations_acceptance enable row level security;
alter table public.flashcard_sources enable row level security;
alter table public.flashcards enable row level security;

-- row level security policies for public.ai_generations
-- authenticated users can select their own ai_generation rows
create policy ai_generations_select_authenticated on public.ai_generations
    for select to authenticated
                   using (user_id = auth.uid());

-- prevent anonymous selection attempts by always returning false
create policy ai_generations_select_anon on public.ai_generations
    for select to anon
                   using (false);

-- authenticated users can insert rows provided they own them
create policy ai_generations_insert_authenticated on public.ai_generations
    for insert to authenticated
    with check (user_id = auth.uid());

-- anonymous inserts are explicitly denied
create policy ai_generations_insert_anon on public.ai_generations
    for insert to anon
    with check (false);

-- authenticated users may update only their own rows and must preserve ownership
create policy ai_generations_update_authenticated on public.ai_generations
    for update to authenticated
                                 using (user_id = auth.uid())
        with check (user_id = auth.uid());

-- anonymous updates are disallowed
create policy ai_generations_update_anon on public.ai_generations
    for update to anon
                   using (false)
        with check (false);

-- authenticated users may delete only their own rows
create policy ai_generations_delete_authenticated on public.ai_generations
    for delete to authenticated
    using (user_id = auth.uid());

-- anonymous deletes are rejected
create policy ai_generations_delete_anon on public.ai_generations
    for delete to anon
    using (false);

-- row level security policies for public.ai_generations_acceptance
-- authenticated users can read acceptance aggregates they own
create policy ai_generations_acceptance_select_authenticated on public.ai_generations_acceptance
    for select to authenticated
                                                               using (user_id = auth.uid());

-- anonymous selects are denied
create policy ai_generations_acceptance_select_anon on public.ai_generations_acceptance
    for select to anon
                   using (false);

-- authenticated inserts permitted only for owning user
create policy ai_generations_acceptance_insert_authenticated on public.ai_generations_acceptance
    for insert to authenticated
    with check (user_id = auth.uid());

-- anonymous inserts rejected
create policy ai_generations_acceptance_insert_anon on public.ai_generations_acceptance
    for insert to anon
    with check (false);

-- authenticated updates restricted to owner rows and must keep ownership consistent
create policy ai_generations_acceptance_update_authenticated on public.ai_generations_acceptance
    for update to authenticated
                                 using (user_id = auth.uid())
        with check (user_id = auth.uid());

-- anonymous updates disallowed
create policy ai_generations_acceptance_update_anon on public.ai_generations_acceptance
    for update to anon
                   using (false)
        with check (false);

-- authenticated deletes limited to owner rows
create policy ai_generations_acceptance_delete_authenticated on public.ai_generations_acceptance
    for delete to authenticated
    using (user_id = auth.uid());

-- anonymous deletes denied
create policy ai_generations_acceptance_delete_anon on public.ai_generations_acceptance
    for delete to anon
    using (false);

-- row level security policies for public.flashcard_sources
-- authenticated users can select only their own flashcard source records
create policy flashcard_sources_select_authenticated on public.flashcard_sources
    for select to authenticated
                                                               using (user_id = auth.uid());

-- anonymous selection prohibited
create policy flashcard_sources_select_anon on public.flashcard_sources
    for select to anon
                   using (false);

-- authenticated insertions permitted when tied to current user
create policy flashcard_sources_insert_authenticated on public.flashcard_sources
    for insert to authenticated
    with check (user_id = auth.uid());

-- anonymous insertions rejected
create policy flashcard_sources_insert_anon on public.flashcard_sources
    for insert to anon
    with check (false);

-- authenticated updates restricted to owner records and must preserve ownership
create policy flashcard_sources_update_authenticated on public.flashcard_sources
    for update to authenticated
                                 using (user_id = auth.uid())
        with check (user_id = auth.uid());

-- anonymous updates denied
create policy flashcard_sources_update_anon on public.flashcard_sources
    for update to anon
                   using (false)
        with check (false);

-- authenticated deletes limited to owner records
create policy flashcard_sources_delete_authenticated on public.flashcard_sources
    for delete to authenticated
    using (user_id = auth.uid());

-- anonymous deletes rejected
create policy flashcard_sources_delete_anon on public.flashcard_sources
    for delete to anon
    using (false);

-- row level security policies for public.flashcards
-- authenticated users can select only their accepted flashcards
create policy flashcards_select_authenticated on public.flashcards
    for select to authenticated
                                                               using (user_id = auth.uid());

-- anonymous selects denied
create policy flashcards_select_anon on public.flashcards
    for select to anon
                   using (false);

-- authenticated inserts allowed when the flashcard belongs to the current user
create policy flashcards_insert_authenticated on public.flashcards
    for insert to authenticated
    with check (user_id = auth.uid());

-- anonymous inserts rejected
create policy flashcards_insert_anon on public.flashcards
    for insert to anon
    with check (false);

-- authenticated updates restricted to owner rows with ownership preservation
create policy flashcards_update_authenticated on public.flashcards
    for update to authenticated
                                 using (user_id = auth.uid())
        with check (user_id = auth.uid());

-- anonymous updates denied
create policy flashcards_update_anon on public.flashcards
    for update to anon
                   using (false)
        with check (false);

-- authenticated deletes limited to owner rows
create policy flashcards_delete_authenticated on public.flashcards
    for delete to authenticated
    using (user_id = auth.uid());

-- anonymous deletes rejected
create policy flashcards_delete_anon on public.flashcards
    for delete to anon
    using (false);