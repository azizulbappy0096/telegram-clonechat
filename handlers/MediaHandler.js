class MediaHandler {
  canHandle(message) {
    throw new Error("Override canHandle()");
  }

  buildOptions(message, file) {
    throw new Error("Override buildOptions()");
  }

  async process(message, context) {
    const { sender, downloader, reply, tempFiles } = context.services;

    const file = await downloader.download(message);

    const options = {
      ...this.buildOptions(message, file),
      ...reply.buildOptions(message),
    };

    const sent = await sender.sendFile(context.destination, options);

    await tempFiles.remove(file);

    return sent;
  }
}
