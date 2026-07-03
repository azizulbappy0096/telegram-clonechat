const MediaHandler = require("./MediaHandler");

class StickerHandler {
  canHandle(message) {
    return !!message.sticker;
  }

  buildOptions(message, file) {
    return {
      file,
    };
  }
}

module.exports = StickerHandler;
