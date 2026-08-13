const configuredSendDelay = Number(process.env.SEND_DELAY_MS);
const configuredInviteBatchSize = Number(process.env.INVITE_BATCH_SIZE);
const configuredInviteDelay = Number(process.env.INVITE_DELAY_MS);

module.exports = {
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH,
  sourceGroup: process.env.SOURCE_GROUP,
  destinationGroup: process.env.DESTINATION_GROUP,
  sendDelayMs:
    Number.isFinite(configuredSendDelay) && configuredSendDelay >= 0
      ? configuredSendDelay
      : 1000,
  inviteBatchSize:
    Number.isInteger(configuredInviteBatchSize) &&
    configuredInviteBatchSize > 0 &&
    configuredInviteBatchSize <= 50
      ? configuredInviteBatchSize
      : 10,
  inviteDelayMs:
    Number.isFinite(configuredInviteDelay) && configuredInviteDelay >= 0
      ? configuredInviteDelay
      : 30000,
};
