class MessageTypeService {
  getType(message) {
    if (Array.isArray(message)) return "album";
    if (message.photo) return "photo";
    if (message.voice) return "voice";
    if (message.video) return "video";
    if (message.document) return "document";
    if (message.message && !message.media) return "text";

    return "unknown";
  }
}

module.exports = new MessageTypeService();
