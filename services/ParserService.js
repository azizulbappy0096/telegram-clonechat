const TextHandler = require("../handlers/TextHandler");
const AlbumHandler = require("../handlers/AlbumHandler");
const PhotoHandler = require("../handlers/PhotoHandler");
const VoiceHandler = require("../handlers/VoiceHandler");
const VideoHandler = require("../handlers/VideoHandler");
const UnknownHandler = require("../handlers/UnknownHandler");

class ParserService {
  constructor() {
    this.handlers = [
      new AlbumHandler(),

      new TextHandler(),

      new PhotoHandler(),

      new VoiceHandler(),

      new VideoHandler(),

      new UnknownHandler(),
    ];
  }

  parse(message) {
    return this.handlers.find((h) => h.canHandle(message));
  }

  async process(message, context) {
    console.log(message);
    const handler = this.parse(message);

    return await handler.process(message, context);
  }
}

module.exports = ParserService;
