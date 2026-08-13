const logger = require("./LoggerService");
const withFloodWait = require("../utils/floodWait");

class DialogService {
  constructor(client) {
    this.client = client;
    this.dialogs = null;
  }

  async listDialogs() {
    if (!this.dialogs) {
      this.dialogs = await withFloodWait(
        () => this.client.getDialogs({}),
        "Loading dialogs",
      );
    }
    return this.dialogs;
  }

  async findDialog(identifier) {
    const dialogs = await this.listDialogs();

    const dialog = dialogs.find((d) => {
      if (d.title === identifier) return true;

      if (d.entity.username === identifier) return true;

      if (String(d.id) === String(identifier)) return true;

      return false;
    });

    if (!dialog) {
      throw new Error(`${identifier} not found`);
    }

    return dialog;
  }

  async printDialogs() {
    const dialogs = await this.listDialogs();

    for (const dialog of dialogs) {
      console.log("--------------------------------");
      console.table({
        title: dialog.title,
        id: dialog.id.value.toString(),
        username: dialog.entity.username,
      });
      console.log("--------------------------------");
    }
  }
}

module.exports = DialogService;
