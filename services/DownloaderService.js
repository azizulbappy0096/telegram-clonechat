const path = require("path");
const mime = require("mime-types");
const withFloodWait = require("../utils/floodWait");

class DownloaderService {
  constructor(client, tempFiles) {
    this.client = client;
    this.tempFiles = tempFiles;
  }

  getFileName(message) {
    if (message.photo) return `photo-${message.id}.jpg`;

    const originalName = message.file && message.file.name;
    if (originalName) return originalName;

    const mimeType =
      (message.file && message.file.mimeType) ||
      (message.document && message.document.mimeType);
    const extension = mime.extension(mimeType || "") || "bin";

    return `media-${message.id}.${extension}`;
  }

  async download(message) {
    const filePath = await this.tempFiles.add(this.getFileName(message));

    try {
      const downloaded = await withFloodWait(
        () =>
          this.client.downloadMedia(message, {
            outputFile: filePath,
          }),
        `Downloading message ${message.id}`,
      );

      if (!downloaded || Buffer.isBuffer(downloaded)) {
        throw new Error(`Telegram did not download message ${message.id} to disk`);
      }

      return path.resolve(downloaded);
    } catch (error) {
      await this.tempFiles.remove(filePath);
      throw error;
    }
  }
}

module.exports = DownloaderService;
