const MediaHandler = require("./MediaHandler");

class VoiceHandler extends MediaHandler {
  canHandle(message) {
    return !!message.voice;
  }

  buildOptions(message, file) {
    return {
      file,
      caption: message.message || "",
      voiceNote: true,
    };
  }
}

module.exports = VoiceHandler;
