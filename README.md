# Telegram Migrator

A small Node.js tool for copying Telegram messages and media from one chat to
another.

## Setup

1. Install Node.js and clone this repository.
2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   API_ID=your_telegram_api_id
   API_HASH=your_telegram_api_hash
   SOURCE_GROUP=source_chat_id_username_or_exact_title
   DESTINATION_GROUP=destination_chat_id_username_or_exact_title
   ```

   Get `API_ID` and `API_HASH` from your Telegram API application. The source
   and destination can be a chat ID, username, or exact dialog title. Your
   Telegram account must have access to both chats and permission to post in
   the destination.

## Run

Start the migration:

```bash
npm start
```

On the first run, enter your phone number, verification code, and 2FA password
when prompted. The login session is saved in `session.txt`, so later runs
normally do not require another login.

The migrator currently handles text, photos, albums, voice messages, videos,
and documents.

## Progress and failures

Runtime data is stored in `storage/`:

- `message-map.ndjson` records successfully migrated message IDs and types.
- `failed.ndjson` records failed messages and their errors.
- `checkpoint.json` stores migration progress.
- `temp/` temporarily holds downloaded media and is cleaned after processing.

You can stop and run the command again; messages already present in
`message-map.ndjson` are skipped.

Run the automated tests with:

Keep `.env`, `session.txt`, and the `storage/` directory private because they
may contain account credentials or migration metadata.
