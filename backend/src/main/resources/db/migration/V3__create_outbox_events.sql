-- V3: Create outbox_events table for the transactional outbox pattern.
-- Events are written atomically with booking state changes and consumed by the
-- OutboxEventScheduler (and later by the Notification module).

create table if not exists outbox_events (
    id           bigint generated always as identity primary key,
    event_type   text        not null,
    payload      text        not null,
    status       text        not null default 'PENDING',
    created_at   timestamptz not null default now(),
    processed_at timestamptz,
    constraint outbox_status_check check (status in ('PENDING', 'PROCESSED', 'FAILED'))
);

-- Index to speed up the scheduler's poll for PENDING events
create index if not exists idx_outbox_events_status
    on outbox_events (status)
    where status = 'PENDING';
