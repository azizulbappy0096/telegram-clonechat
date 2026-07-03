const MediaHandler = require("./MediaHandler");

class DocumentHandler extends MediaHandler {
  canHandle(message) {
    return (
      !!message.document && !message.video && !message.voice && !message.sticker
    );
  }

  buildOptions(message, file) {
    return {
      file,
      caption: message.message || "",
      forceDocument: true,
    };
  }
}

module.exports = DocumentHandler;
