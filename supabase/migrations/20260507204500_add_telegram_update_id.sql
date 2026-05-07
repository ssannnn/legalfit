alter table public.intake_messages
  add column if not exists telegram_update_id bigint;

alter table public.intake_messages
  add column if not exists telegram_chat_id bigint;

create unique index if not exists intake_messages_telegram_update_id_idx
  on public.intake_messages (telegram_update_id)
  where telegram_update_id is not null;

create unique index if not exists intake_messages_telegram_chat_message_idx
  on public.intake_messages (telegram_chat_id, telegram_message_id)
  where telegram_chat_id is not null and telegram_message_id is not null;
