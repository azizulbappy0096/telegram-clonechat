const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

class TempFileService {
  constructor(directory = path.join(process.cwd(), "storage", "temp")) {
    this.directory = directory;
    this.files = new Set();
  }

  async add(fileName = "media.bin") {
    await fs.promises.mkdir(this.directory, { recursive: true });

    const extension = path.extname(fileName);
    const baseName =
      path
        .basename(fileName, extension)
        .replace(/[^a-zA-Z0-9._-]+/g, "_")
        .slice(0, 80) || "media";
    const filePath = path.join(
      this.directory,
      `${baseName}-${randomUUID()}${extension}`,
    );

    this.files.add(filePath);
    return filePath;
  }

  async remove(files) {
    const fileList = Array.isArray(files) ? files : [files];

    await Promise.all(
      fileList.filter(Boolean).map(async (file) => {
        try {
          await fs.promises.unlink(file);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }

        this.files.delete(file);
      }),
    );
  }

  async cleanup() {
    await this.remove([...this.files]);
  }
}

module.exports = TempFileService;
