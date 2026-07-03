const MediaHandler = require("./MediaHandler");

class VoiceHandler {
  canHandle(message) {
    return !!message.voice;
  }

  buildOptions(message, file) {
    return { file, voiceNote: true };
  }
}

module.exports = VoiceHandler;
