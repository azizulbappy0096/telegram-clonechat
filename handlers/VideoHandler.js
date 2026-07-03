const MediaHandler = require("./MediaHandler");

class VideoHandler extends MediaHandler {
  canHandle(message) {
    return !!message.video;
  }

  buildOptions(message, file) {
    return {
      file,
      caption: message.message || "",
      supportsStreaming: true,
    };
  }
}

module.exports = VideoHandler;
