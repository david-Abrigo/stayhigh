## Table `devices`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `device_name` | `text` |  |
| `device_token_hash` | `text` |  Unique |
| `active` | `bool` |  |
| `last_seen_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `precharges`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `public_id` | `text` |  Unique |
| `expected_name` | `text` |  |
| `expected_name_normalized` | `text` |  |
| `expected_amount` | `numeric` |  |
| `currency` | `text` |  |
| `description` | `text` |  Nullable |
| `status` | `precharge_status` |  |
| `created_at` | `timestamptz` |  |
| `expires_at` | `timestamptz` |  |
| `matched_notification_id` | `uuid` |  Nullable |
| `matched_at` | `timestamptz` |  Nullable |
| `metadata` | `jsonb` |  |

## Table `payment_notifications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `notification_id` | `text` |  Unique |
| `device_id` | `uuid` |  |
| `source_package` | `text` |  |
| `detected_name` | `text` |  Nullable |
| `detected_name_normalized` | `text` |  Nullable |
| `detected_amount` | `numeric` |  Nullable |
| `received_at_device` | `timestamptz` |  Nullable |
| `received_at_server` | `timestamptz` |  |
| `notification_hash` | `text` |  Nullable |
| `processed` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `payment_matches`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `precharge_id` | `uuid` |  |
| `notification_id` | `uuid` |  |
| `amount_match` | `bool` |  |
| `name_match` | `bool` |  |
| `time_match` | `bool` |  |
| `duplicate` | `bool` |  |
| `ambiguous` | `bool` |  |
| `result` | `match_result` |  |
| `details` | `jsonb` |  |
| `created_at` | `timestamptz` |  |

## Table `payment_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `precharge_id` | `uuid` |  Nullable |
| `notification_id` | `uuid` |  Nullable |
| `event_type` | `text` |  |
| `details` | `jsonb` |  |
| `created_at` | `timestamptz` |  |

## Custom Types / Enums

### `match_result`

`MATCHED` | `AMOUNT_MISMATCH` | `NAME_MISMATCH` | `TIME_MISMATCH` | `DUPLICATE` | `AMBIGUOUS` | `INVALID_SOURCE` | `REJECTED`

### `precharge_status`

`WAITING` | `MATCHED` | `EXPIRED` | `CANCELLED` | `AMBIGUOUS`

## RLS Policies

### `devices`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow devices select for anon` | SELECT | anon | PERMISSIVE | `true` | — |
| `Allow devices update for anon` | UPDATE | anon | PERMISSIVE | `true` | `true` |
| `Allow devices insert for anon` | INSERT | anon | PERMISSIVE | — | `true` |

### `payment_notifications`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow payment_notifications select for anon` | SELECT | anon | PERMISSIVE | `true` | — |
| `Allow payment_notifications insert for anon` | INSERT | anon | PERMISSIVE | — | `true` |

### `payment_matches`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow payment_matches select for anon` | SELECT | anon | PERMISSIVE | `true` | — |

