const fs = require("fs");
const path = require("path");

const CHECKPOINT = path.join(process.cwd(), "storage", "checkpoint.json");

class CheckpointService {
  constructor() {
    this.data = {
      lastMessageId: 0,
    };
  }

  load() {
    if (!fs.existsSync(CHECKPOINT)) return this.data;

    this.data = JSON.parse(fs.readFileSync(CHECKPOINT));

    return this.data;
  }

  save(id) {
    this.data.lastMessageId = id;

    fs.writeFileSync(CHECKPOINT, JSON.stringify(this.data, null, 4));
  }

  reset() {
    this.save(0);
  }
}

module.exports = new CheckpointService();
