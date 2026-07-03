const logger = require("../services/LoggerService");

class TextHandler {
  canHandle(message) {
    return !!message.message && !message.media;
  }

  async process(message, context) {
    const { sender, reply } = context.services;

    const options = {
      message: message.message,
      ...reply.buildOptions(message),
    };
    return sender.sendMessage(context.destination, options);
  }
}

module.exports = TextHandler;
