require("dotenv").config();
const config = require("./config/telegram");

const logger = require("./services/LoggerService");
const loginService = require("./services/LoginService");
const DialogService = require("./services/DialogService");
const MigrationService = require("./services/MigrationService");
const MessageMapService = require("./services/MessageMapService");

(async () => {
  let client;
  try {
    logger.info("Starting Telegram Migrator...");
    client = await loginService.login();
    logger.info("Connected!");

    await MessageMapService.load();

    // Get source and destination dialogs (Groups)
    const dialogs = new DialogService(client);

    const source = await dialogs.findDialog(config.sourceGroup);
    const destination = await dialogs.findDialog(config.destinationGroup);

    logger.info(`Source: ${source.title} (${source.id})`);
    logger.info(`Destination: ${destination.title} (${destination.id})`);

    // Migrate messages from source to destination
    const migration = new MigrationService(client, MessageMapService);

    await migration.migrate(source.entity, destination.entity);
  } catch (error) {
    logger.error(error);
    process.exitCode = 1;
  } finally {
    if (client) await client.disconnect();
  }
})();
