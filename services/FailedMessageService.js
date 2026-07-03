const fs = require("fs");
const path = require("path");

class FailedMessageService {
  constructor(
    filePath = path.join(process.cwd(), "storage", "failed.ndjson"),
  ) {
    this.filePath = filePath;
    this.initializePromise = null;
  }

  async initialize() {
    if (!this.initializePromise) {
      this.initializePromise = (async () => {
        await fs.promises.mkdir(path.dirname(this.filePath), {
          recursive: true,
        });
        await fs.promises.appendFile(this.filePath, "");
      })();
    }

    return this.initializePromise;
  }

  async append(oldId, type, error) {
    await this.initialize();

    const row = JSON.stringify({
      old: oldId,
      new: null,
      type,
      migratedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });

    await fs.promises.appendFile(this.filePath, row + "\n");
  }
}

module.exports = new FailedMessageService();
module.exports.FailedMessageService = FailedMessageService;
