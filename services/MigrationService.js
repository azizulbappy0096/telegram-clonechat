const logger = require("./LoggerService");
const CheckpointService = require("./CheckpointService");
const ParserService = require("./ParserService");
const SenderService = require("./SenderService");
const ReplyService = require("./ReplyService");
const DownloaderService = require("./DownloaderService");
const TempFileService = require("./TempFileService");
const MessageTypeService = require("./MessageTypeService");
const FailedMessageService = require("./FailedMessageService");
const withFloodWait = require("../utils/floodWait");

class MigrationService {
  constructor(client, messageMap, failedMessages = FailedMessageService) {
    this.client = client;
    this.messageMap = messageMap;
    this.failedMessages = failedMessages;
    this.stats = {
      processed: 0,
      failed: 0,
      skipped: 0,
    };

    this.sender = new SenderService(client);
    this.replyService = new ReplyService(messageMap);
    this.tempFiles = new TempFileService();
    this.downloader = new DownloaderService(client, this.tempFiles);

    this.parserService = new ParserService();
  }

  async loadMessages(source) {
    const messages = [];
    const iterator = this.client
      .iterMessages(source, { reverse: true })
      [Symbol.asyncIterator]();

    while (true) {
      const result = await withFloodWait(
        () => iterator.next(),
        "Loading source messages",
      );

      if (result.done) break;
      messages.push(result.value);
    }

    return messages;
  }

  async processMessage(message) {
    logger.info({
      id: message.id,
      hasText: !!message.message,
      hasPhoto: !!message.photo,
      hasVideo: !!message.video,
      hasDocument: !!message.document,
    });
  }

  async processMessages(messages, context) {
    CheckpointService.load();
    const items = this.groupAlbums(messages);

    let current = 1;

    for (const item of items) {
      const itemMessages = Array.isArray(item) ? item : [item];
      const pendingMessages = itemMessages.filter(
        (message) => !this.messageMap.has(message.id),
      );

      logger.info(`Processing [${current}/${items.length}]`);
      current++;

      if (!pendingMessages.length) {
        logger.info(
          `Skipping message(s) ${itemMessages.map(({ id }) => id).join(", ")} (already processed)`,
        );
        this.stats.skipped += itemMessages.length;
        continue;
      }

      try {
        const input =
          pendingMessages.length > 1 ? pendingMessages : pendingMessages[0];
        const type = MessageTypeService.getType(
          itemMessages.length > 1 ? itemMessages : input,
        );
        const sent = await this.parserService.process(input, context);
        const sentMessages = Array.isArray(sent) ? sent : [sent];

        for (let index = 0; index < pendingMessages.length; index++) {
          const sentMessage = sentMessages[index] || sentMessages[0];
          if (!sentMessage || !sentMessage.id) {
            throw new Error(
              `No sent message returned for source message ${pendingMessages[index].id}`,
            );
          }

          await this.messageMap.append(
            pendingMessages[index].id,
            sentMessage.id,
            type,
          );
        }

        CheckpointService.save(pendingMessages[pendingMessages.length - 1].id);
        this.stats.processed += pendingMessages.length;
        this.stats.skipped += itemMessages.length - pendingMessages.length;
      } catch (err) {
        this.stats.failed += pendingMessages.length;
        logger.error(err);

        const type = MessageTypeService.getType(
          itemMessages.length > 1 ? itemMessages : pendingMessages[0],
        );

        for (const message of pendingMessages) {
          try {
            await this.failedMessages.append(message.id, type, err);
          } catch (failedLogError) {
            logger.error(failedLogError);
          }
        }
      }
    }
  }

  groupAlbums(messages) {
    const items = [];

    for (const message of messages) {
      const groupedId = message.groupedId && message.groupedId.toString();
      const previous = items[items.length - 1];
      const previousMessages = Array.isArray(previous) ? previous : [previous];
      const previousMessage = previousMessages[previousMessages.length - 1];
      const previousGroupedId =
        previousMessage &&
        previousMessage.groupedId &&
        previousMessage.groupedId.toString();

      if (groupedId && groupedId === previousGroupedId) {
        if (Array.isArray(previous)) {
          previous.push(message);
        } else {
          items[items.length - 1] = [previous, message];
        }
      } else {
        items.push(message);
      }
    }

    return items;
  }

  async migrate(source, destination) {
    logger.info("Loading messages...");
    const messages = await this.loadMessages(source);
    logger.info(`Loaded ${messages.length} messages.`);
    await this.failedMessages.initialize();

    const context = {
      source,
      destination,
      services: {
        sender: this.sender,
        downloader: this.downloader,
        reply: this.replyService,
        messageMap: this.messageMap,
        tempFiles: this.tempFiles,
      },
    };

    try {
      await this.processMessages(messages, context);
    } finally {
      await this.tempFiles.cleanup();
    }

    logger.info("\n\n\nMigration complete.");
    logger.info(`Processed: ${this.stats.processed}`);
    logger.info(`Failed: ${this.stats.failed}`);
    logger.info(`Skipped: ${this.stats.skipped}`);
  }
}

module.exports = MigrationService;
