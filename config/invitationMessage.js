module.exports = function invitationMessage({ sourceTitle, inviteLink }) {
  return [
    `Hello! We are moving ${sourceTitle} to a new group.`,
    "",
    `Join the new group here: ${inviteLink}`,
    "",
    "You are receiving this invitation because you are a member of the old group.",
  ].join("\n");
};
