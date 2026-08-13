const fs = require("fs");
const path = require("path");

const { Api } = require("telegram");
const {
  FloodTestPhoneWaitError,
  FloodWaitError,
  SlowModeWaitError,
} = require("telegram/errors");

const config = require("../config/telegram");
const invitationMessage = require("../config/invitationMessage");
const withFloodWait = require("../utils/floodWait");
const sleep = require("../utils/sleep");
const logger = require("./LoggerService");

const FINAL_STATUSES = new Set([
  "sent",
  "already-member",
  "privacy-blocked",
  "skipped-bot",
  "skipped-deleted",
  "skipped-self",
]);

const PERMANENT_ERRORS = [
  "USER_PRIVACY_RESTRICTED",
  "USER_IS_BLOCKED",
  "YOU_BLOCKED_USER",
  "INPUT_USER_DEACTIVATED",
  "PREMIUM_ACCOUNT_REQUIRED",
];

class MemberService {
  constructor(client) {
    this.client = client;
    this.statePath = path.join(
      process.cwd(),
      "storage",
      "member-invitations.ndjson",
    );
    this.controlPath = path.join(
      process.cwd(),
      "storage",
      "member-invite.json",
    );
    this.state = new Map();
    this.control = {};
  }

  async initialize() {
    await fs.promises.mkdir(path.dirname(this.statePath), { recursive: true });
    await fs.promises.appendFile(this.statePath, "");
    await this.loadState();

    try {
      this.control = JSON.parse(
        await fs.promises.readFile(this.controlPath, "utf8"),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async loadState() {
    const contents = await fs.promises.readFile(this.statePath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      if (!line.trim()) continue;

      try {
        const row = JSON.parse(line);
        this.state.set(String(row.userId), row);
      } catch (error) {
        logger.warn(`Skipping invalid invitation record: ${line}`);
      }
    }
  }

  async saveControl() {
    await fs.promises.writeFile(
      this.controlPath,
      JSON.stringify(this.control, null, 2),
    );
  }

  async record(user, status, error) {
    const userId = user.id.toString();
    const previous = this.state.get(userId);
    const row = {
      userId,
      username: user.username || null,
      status,
      attempts: (previous && previous.attempts ? previous.attempts : 0) +
        (status === "pending" ? 0 : 1),
      updatedAt: new Date().toISOString(),
    };

    if (error) {
      row.error = error.errorMessage || error.message || String(error);
    }

    this.state.set(userId, row);
    await fs.promises.appendFile(this.statePath, JSON.stringify(row) + "\n");
  }

  async getInviteLink(destination) {
    const destinationId = destination.id.toString();
    if (
      this.control.inviteLink &&
      this.control.destinationId === destinationId
    ) {
      return this.control.inviteLink;
    }

    const invite = await withFloodWait(
      () =>
        this.client.invoke(
          new Api.messages.ExportChatInvite({
            peer: destination,
            requestNeeded: true,
            title: "Group migration",
          }),
        ),
      "Creating destination invite link",
    );

    this.control.inviteLink = invite.link;
    this.control.destinationId = destinationId;
    await this.saveControl();
    return invite.link;
  }

  async eachParticipant(entity, operation, callback) {
    const iterator = this.client
      .iterParticipants(entity)
      [Symbol.asyncIterator]();

    while (true) {
      const result = await withFloodWait(() => iterator.next(), operation);
      if (result.done) break;
      await callback(result.value);
    }
  }

  async getDestinationMemberIds(destination) {
    const ids = new Set();
    await this.eachParticipant(
      destination,
      "Loading destination members",
      async (user) => ids.add(user.id.toString()),
    );
    return ids;
  }

  getErrorName(error) {
    return String(error.errorMessage || error.message || "").toUpperCase();
  }

  isFloodWait(error) {
    return (
      error instanceof FloodWaitError ||
      error instanceof FloodTestPhoneWaitError ||
      error instanceof SlowModeWaitError
    );
  }

  async inviteMembers(source, destination) {
    await this.initialize();

    if (
      this.control.pausedUntil &&
      new Date(this.control.pausedUntil).getTime() > Date.now()
    ) {
      logger.warn(`Invitation sending is paused until ${this.control.pausedUntil}`);
      return;
    }

    if (this.control.pausedUntil) {
      delete this.control.pausedUntil;
      await this.saveControl();
    }

    const inviteLink = await this.getInviteLink(destination);
    const destinationMemberIds = await this.getDestinationMemberIds(destination);
    const self = await withFloodWait(() => this.client.getMe(), "Loading account");
    const selfId = self.id.toString();
    const candidates = [];

    await this.eachParticipant(source, "Loading source members", async (user) => {
      const userId = user.id.toString();
      const previous = this.state.get(userId);

      if (!previous) await this.record(user, "pending");
      if (previous && FINAL_STATUSES.has(previous.status)) return;
      if (previous && previous.attempts >= 3) return;

      if (userId === selfId) return this.record(user, "skipped-self");
      if (user.bot) return this.record(user, "skipped-bot");
      if (user.deleted) return this.record(user, "skipped-deleted");
      if (destinationMemberIds.has(userId)) {
        return this.record(user, "already-member");
      }

      candidates.push(user);
    });

    const batch = candidates.slice(0, config.inviteBatchSize);
    let sent = 0;
    let failed = 0;
    let attempted = 0;

    for (let index = 0; index < batch.length; index++) {
      const user = batch[index];
      if (index > 0 && config.inviteDelayMs > 0) {
        await sleep(config.inviteDelayMs);
      }

      attempted++;

      try {
        await this.client.sendMessage(user, {
          message: invitationMessage({
            sourceTitle: source.title || config.sourceGroup,
            inviteLink,
          }),
          linkPreview: false,
        });
        await this.record(user, "sent");
        sent++;
        logger.info(`Invitation sent to ${user.id}`);
      } catch (error) {
        const errorName = this.getErrorName(error);

        if (this.isFloodWait(error)) {
          this.control.pausedUntil = new Date(
            Date.now() + (Number(error.seconds) + 1) * 1000,
          ).toISOString();
          await this.saveControl();
          await this.record(user, "paused", error);
          logger.warn(`Invitation run paused until ${this.control.pausedUntil}`);
          break;
        }

        if (errorName.includes("PEER_FLOOD")) {
          await this.record(user, "peer-flood", error);
          logger.error("Telegram stopped the invitation run with PEER_FLOOD");
          break;
        }

        const permanent = PERMANENT_ERRORS.some((name) =>
          errorName.includes(name),
        );
        await this.record(user, permanent ? "privacy-blocked" : "failed", error);
        failed++;
      }
    }

    logger.info(`Invitation batch complete. Sent: ${sent}, failed: ${failed}`);
    logger.info(
      `Eligible members remaining: ${Math.max(candidates.length - attempted, 0)}`,
    );
  }
}

module.exports = MemberService;
