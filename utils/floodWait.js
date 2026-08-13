const {
  FloodTestPhoneWaitError,
  FloodWaitError,
  SlowModeWaitError,
} = require("telegram/errors");

const logger = require("../services/LoggerService");
const sleep = require("./sleep");

function isWaitError(error) {
  return (
    error instanceof FloodWaitError ||
    error instanceof FloodTestPhoneWaitError ||
    error instanceof SlowModeWaitError
  );
}

async function withFloodWait(fn, operation = "Telegram request") {
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (!isWaitError(error)) throw error;

      const seconds = Number(error.seconds) || 0;
      logger.warn(
        `${operation} paused by Telegram for ${seconds}s; retrying afterward`,
      );

      // Add one second because Telegram's wait value is rounded to seconds.
      await sleep((seconds + 1) * 1000);
    }
  }
}

module.exports = withFloodWait;
