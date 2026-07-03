const logger = require("./LoggerService");
const CheckpointService = require("./CheckpointService");
const ParserService = require("./ParserService");
const SenderService = require("./SenderService");
const ReplyService = require("./ReplyService");

class MigrationService {
  constructor(client, messageMap) {
    this.client = client;
    this.messageMap = messageMap;
    this.stats = {
      processed: 0,
      failed: 0,
      skipped: 0,
    };

    this.sender = new SenderService(client);
    this.replyService = new ReplyService(messageMap);

    this.parserService = new ParserService();
  }

  async loadMessages(source) {
    const messages = [];

    for await (const message of this.client.iterMessages(source, {
      reverse: true,
    })) {
      messages.push(message);
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
    const checkpoint = CheckpointService.load();

    let current = 1;

    for (const message of messages) {
      logger.info(`Processing [${current}/${messages.length}]`);

      current++;
      if (
        message.id <= checkpoint.lastMessageId ||
        this.messageMap.has(message.id)
      ) {
        logger.info(`Skipping message ${message.id} (already processed)`);
        this.stats.skipped++;
        continue;
      }

      try {
        const sent = await this.parserService.process(message, context);

        this.messageMap.append(message.id, sent.id);
        CheckpointService.save(message.id);
        this.stats.processed++;
      } catch (err) {
        this.stats.failed++;
        logger.error(err);
      }
    }
  }

  async migrate(source, destination) {
    logger.info("Loading messages...");
    const messages = await this.loadMessages(source);
    logger.info(`Loaded ${messages.length} messages.`);

    const context = {
      // message,
      source,
      destination,
      services: {
        sender: this.sender,
        downloader: () =>
          logger.info("Downloader service is not implemented yet."),
        reply: this.replyService,
        messageMap: this.messageMap,
        tempFiles: () =>
          logger.info("TempFiles service is not implemented yet."),
      },

      // logger,
    };

    await this.processMessages(messages, context);

    logger.info("\n\n\nMigration complete.");
    logger.info(`Processed: ${this.stats.processed}`);
    logger.info(`Failed: ${this.stats.failed}`);
    logger.info(`Skipped: ${this.stats.skipped}`);
  }
}

module.exports = MigrationService;
