const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const AlbumHandler = require("../handlers/AlbumHandler");
const PhotoHandler = require("../handlers/PhotoHandler");
const ParserService = require("../services/ParserService");
const DownloaderService = require("../services/DownloaderService");
const MigrationService = require("../services/MigrationService");
const TempFileService = require("../services/TempFileService");

test("downloader creates a named temporary file and cleanup removes it", async () => {
  const directory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "telegram-migrator-"),
  );
  const tempFiles = new TempFileService(directory);
  const client = {
    async downloadMedia(_message, { outputFile }) {
      await fs.promises.writeFile(outputFile, "photo");
      return outputFile;
    },
  };
  const downloader = new DownloaderService(client, tempFiles);

  const file = await downloader.download({ id: 10, photo: {} });

  assert.equal(path.extname(file), ".jpg");
  assert.equal(fs.existsSync(file), true);

  await tempFiles.cleanup();
  assert.equal(fs.existsSync(file), false);
  await fs.promises.rm(directory, { recursive: true });
});

test("downloader removes a partial file when Telegram download fails", async () => {
  const directory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "telegram-migrator-"),
  );
  const tempFiles = new TempFileService(directory);
  const client = {
    async downloadMedia(_message, { outputFile }) {
      await fs.promises.writeFile(outputFile, "partial");
      throw new Error("download failed");
    },
  };
  const downloader = new DownloaderService(client, tempFiles);

  await assert.rejects(
    downloader.download({ id: 11, voice: {}, file: { mimeType: "audio/ogg" } }),
    /download failed/,
  );
  assert.deepEqual(await fs.promises.readdir(directory), []);
  await fs.promises.rm(directory, { recursive: true });
});

test("media handler removes its download when upload fails", async () => {
  const removed = [];
  const handler = new PhotoHandler();
  const context = {
    destination: "destination",
    services: {
      downloader: { download: async () => "temporary.jpg" },
      sender: {
        sendFile: async () => {
          throw new Error("upload failed");
        },
      },
      reply: { buildOptions: () => ({}) },
      tempFiles: { remove: async (file) => removed.push(file) },
    },
  };

  await assert.rejects(handler.process({ photo: {} }, context), /upload failed/);
  assert.deepEqual(removed, ["temporary.jpg"]);
});

test("album handler downloads, sends, and removes every album item", async () => {
  const removed = [];
  const sent = [{ id: 101 }, { id: 102 }];
  const context = {
    destination: "destination",
    services: {
      downloader: {
        download: async (message) => `temporary-${message.id}`,
      },
      sender: {
        sendFile: async (_destination, options) => {
          assert.deepEqual(options.file, ["temporary-1", "temporary-2"]);
          assert.deepEqual(options.caption, ["first", ""]);
          return sent;
        },
      },
      reply: { buildOptions: () => ({ replyTo: 99 }) },
      tempFiles: { remove: async (files) => removed.push(...files) },
    },
  };

  const result = await new AlbumHandler().process(
    [
      { id: 1, message: "first" },
      { id: 2, message: "" },
    ],
    context,
  );

  assert.equal(result, sent);
  assert.deepEqual(removed, ["temporary-1", "temporary-2"]);
});

test("parser selects voice and video handlers", () => {
  const parser = new ParserService();

  assert.equal(parser.parse({ voice: {} }).constructor.name, "VoiceHandler");
  assert.equal(parser.parse({ video: {} }).constructor.name, "VideoHandler");
});

test("migration groups adjacent messages with the same Telegram grouped id", () => {
  const migration = new MigrationService({}, {});
  const groupedId = { toString: () => "album-1" };
  const messages = [
    { id: 1 },
    { id: 2, groupedId },
    { id: 3, groupedId },
    { id: 4 },
  ];

  assert.deepEqual(migration.groupAlbums(messages), [
    messages[0],
    [messages[1], messages[2]],
    messages[3],
  ]);
});
