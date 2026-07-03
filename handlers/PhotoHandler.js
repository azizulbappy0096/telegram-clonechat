const logger = require("../services/LoggerService");

class PhotoHandler {
  canHandle(message) {
    return !!message.photo;
  }

  async process(message, context) {
    logger.info({
      type: "PHOTO",
      id: message.id,
    });

    throw new Error(`PhotoHandler is not implemented yet: ${message.id}`);
  }
}

module.exports = PhotoHandler;
