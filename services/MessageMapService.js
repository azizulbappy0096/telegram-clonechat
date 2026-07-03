const fs = require("fs");
const path = require("path");
const readline = require("readline");

const FILE = path.join(process.cwd(), "storage", "message-map.ndjson");

class MessageMapService {
  constructor(filePath = FILE) {
    this.filePath = filePath;
    this.cache = new Map();
    this.writeStream = null;
  }

  /**
   * Creates the NDJSON file if it doesn't exist.
   */
  async initialize() {
    const dir = path.dirname(this.filePath);

    await fs.promises.mkdir(dir, {
      recursive: true,
    });

    if (!fs.existsSync(this.filePath)) {
      await fs.promises.writeFile(this.filePath, "");
    }

    this.writeStream = fs.createWriteStream(this.filePath, {
      flags: "a",
    });
  }

  /**
   * Loads all mappings into memory.
   */
  async load() {
    await this.initialize();

    this.cache.clear();

    const rl = readline.createInterface({
      input: fs.createReadStream(this.filePath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const row = JSON.parse(line);

        this.cache.set(Number(row.old), Number(row.new));
      } catch (err) {
        console.warn(`Skipping invalid mapping: ${line}`);
      }
    }
  }

  async append(oldId, newId, type = "unknown") {
    this.cache.set(oldId, newId);

    const row = JSON.stringify({
      old: oldId,
      new: newId,
      type,
      migratedAt: new Date().toISOString(),
    });

    return new Promise((resolve, reject) => {
      this.writeStream.write(row + "\n", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  has(oldId) {
    return this.cache.has(oldId);
  }

  get(oldId) {
    return this.cache.get(oldId);
  }

  size() {
    return this.cache.size;
  }

  async clear() {
    this.cache.clear();

    if (this.writeStream) {
      await this.close();
    }

    await fs.promises.writeFile(this.filePath, "");

    this.writeStream = fs.createWriteStream(this.filePath, {
      flags: "a",
    });
  }

  async close() {
    if (!this.writeStream) return;

    await new Promise((resolve) => {
      this.writeStream.end(resolve);
    });

    this.writeStream = null;
  }
}

module.exports = new MessageMapService();
module.exports.MessageMapService = MessageMapService;
