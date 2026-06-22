import type { CollaborationProposal } from "@prisma/client";

type ProposalReadState = Pick<
  CollaborationProposal,
  | "senderId"
  | "recipientId"
  | "status"
  | "lastMessageAt"
  | "lastMessageAuthorId"
  | "lastReadBySenderAt"
  | "lastReadByRecipientAt"
>;

export function isUnreadForUser(proposal: ProposalReadState, userId: string) {
  if (!proposal.lastMessageAt || !proposal.lastMessageAuthorId) {
    return userId === proposal.recipientId && proposal.status === "pending";
  }

  if (proposal.lastMessageAuthorId === userId) {
    return false;
  }

  const lastReadAt =
    userId === proposal.senderId
      ? proposal.lastReadBySenderAt
      : proposal.lastReadByRecipientAt;

  if (!lastReadAt) {
    return true;
  }

  return proposal.lastMessageAt > lastReadAt;
}

export function readFieldForUser(userId: string, proposal: ProposalReadState) {
  return userId === proposal.senderId
    ? "lastReadBySenderAt"
    : "lastReadByRecipientAt";
}
