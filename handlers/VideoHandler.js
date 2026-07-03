const logger = require("../services/LoggerService");

class VideoHandler {
  canHandle(message) {
    return !!message.video;
  }

  async process(message) {
    logger.info({
      type: "VIDEO",
      id: message.id,
    });

    throw new Error(`VideoHandler is not implemented yet: ${message.id}`);
  }
}

module.exports = VideoHandler;
