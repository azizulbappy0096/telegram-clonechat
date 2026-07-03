class AlbumHandler {
  canHandle(message) {
    return Array.isArray(message) && message.length > 1;
  }

  async process(messages, context) {
    const { sender, downloader, reply, tempFiles } = context.services;
    const files = [];

    try {
      for (const message of messages) {
        files.push(await downloader.download(message));
      }

      return await sender.sendFile(context.destination, {
        file: files,
        caption: messages.map((message) => message.message || ""),
        supportsStreaming: true,
        ...reply.buildOptions(messages[0]),
      });
    } finally {
      await tempFiles.remove(files);
    }
  }
}

module.exports = AlbumHandler;
