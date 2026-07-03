class DownloaderService {
  constructor(client) {
    this.client = client;
  }

  async download(message) {
    return await this.client.downloadMedia(message);
  }
}
