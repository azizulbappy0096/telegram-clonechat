const MediaHandler = require("./MediaHandler");

class PhotoHandler extends MediaHandler {
  canHandle(message) {
    return !!message.photo;
  }

  buildOptions(message, file) {
    return {
      file,
      caption: message.message || "",
    };
  }
}

module.exports = PhotoHandler;
