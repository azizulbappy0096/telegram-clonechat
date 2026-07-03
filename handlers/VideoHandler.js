const MediaHandler = require("./MediaHandler");

class VideoHandler extends MediaHandler {
  canHandle(message) {
    return !!message.video;
  }

  buildOptions(message, file) {
    return {
      file,
      caption: message.message || "",
      videoNote: !!message.videoNote,
      supportsStreaming: !message.videoNote,
    };
  }
}

module.exports = VideoHandler;
