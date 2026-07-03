const TextHandler = require("../handlers/TextHandler");
const PhotoHandler = require("../handlers/PhotoHandler");
const VideoHandler = require("../handlers/VideoHandler");
const UnknownHandler = require("../handlers/UnknownHandler");

class ParserService {
  constructor() {
    this.handlers = [
      new TextHandler(),

      new PhotoHandler(),

      new VideoHandler(),

      new UnknownHandler(),
    ];
  }

  parse(message) {
    return this.handlers.find((h) => h.canHandle(message));
  }

  async process(message, context) {
    const handler = this.parse(message);

    return await handler.process(message, context);
  }
}

module.exports = ParserService;
