const logger = require("../services/LoggerService");

class UnknownHandler {
  canHandle() {
    return true;
  }

  async process(message) {
    logger.warn({
      type: "UNKNOWN",
      id: message.id,
    });

    throw new Error(`Unknown message type: ${message.id}`);
  }
}

module.exports = UnknownHandler;
