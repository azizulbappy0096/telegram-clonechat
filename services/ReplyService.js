class ReplyService {
  constructor(messageMap) {
    this.messageMap = messageMap;
  }

  resolveReply(message) {
    if (!message.replyTo) {
      return undefined;
    }

    const originalId = message.replyTo.replyToMsgId;

    return this.messageMap.get(originalId);
  }

  buildOptions(message) {
    const replyId = this.resolveReply(message);

    const options = {};

    if (replyId) {
      options.replyTo = replyId;
    }

    return options;
  }
}

module.exports = ReplyService;
