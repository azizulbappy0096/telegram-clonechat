class MediaHandler {
  canHandle(message) {
    throw new Error("Override canHandle()");
  }

  buildOptions(message, file) {
    throw new Error("Override buildOptions()");
  }

  async process(message, context) {
    const { sender, downloader, reply, tempFiles } = context.services;
    let file;

    try {
      file = await downloader.download(message);

      const options = {
        ...this.buildOptions(message, file),
        ...reply.buildOptions(message),
      };

      return await sender.sendFile(context.destination, options);
    } finally {
      if (file) await tempFiles.remove(file);
    }
  }
}

module.exports = MediaHandler;
