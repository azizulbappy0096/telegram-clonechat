require("dotenv").config();

const config = require("./config/telegram");
const DialogService = require("./services/DialogService");
const loginService = require("./services/LoginService");
const logger = require("./services/LoggerService");
const MemberService = require("./services/MemberService");

(async () => {
  let client;

  try {
    client = await loginService.login();
    const dialogs = new DialogService(client);
    const source = await dialogs.findDialog(config.sourceGroup);
    const destination = await dialogs.findDialog(config.destinationGroup);

    const members = new MemberService(client);
    await members.inviteMembers(source.entity, destination.entity);
  } catch (error) {
    logger.error(error);
    process.exitCode = 1;
  } finally {
    if (client) await client.disconnect();
  }
})();
