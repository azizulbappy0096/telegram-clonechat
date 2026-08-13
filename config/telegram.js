const configuredSendDelay = Number(process.env.SEND_DELAY_MS);

module.exports = {
  apiId: Number(process.env.API_ID),
  apiHash: process.env.API_HASH,
  sourceGroup: process.env.SOURCE_GROUP,
  destinationGroup: process.env.DESTINATION_GROUP,
  sendDelayMs:
    Number.isFinite(configuredSendDelay) && configuredSendDelay >= 0
      ? configuredSendDelay
      : 1000,
};
