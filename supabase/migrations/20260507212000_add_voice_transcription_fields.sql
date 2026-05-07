alter table public.intake_messages
  add column if not exists telegram_file_id text;

alter table public.intake_messages
  add column if not exists transcription_status text;

alter table public.intake_messages
  add column if not exists transcription_error text;

alter table public.intake_messages
  add column if not exists original_audio_retained boolean not null default false;

alter table public.intake_messages
  add column if not exists audio_retained_until timestamptz;

do $$
begin
  alter table public.intake_messages
    add constraint intake_messages_transcription_status_check check (
      transcription_status is null
      or transcription_status in ('queued', 'retrying', 'succeeded', 'failed')
    );
exception
  when duplicate_object then null;
end $$;
