const logger = require("../services/LoggerService");

class UnknownHandler {
  canHandle() {
    return true;
  }

  async process(message) {
    logger.warn(`Unsupported message ${message.id}`);

    return null;
  }
}

module.exports = UnknownHandler;
