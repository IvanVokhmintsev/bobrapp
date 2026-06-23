import type { CollaborationProposal, ProposalMessage, User } from "@prisma/client";

import { isUnreadForUser } from "./proposals.service.js";

type ProposalSender = Pick<User, "id" | "name" | "role"> & {
  labelProfile: { companyName: string } | null;
  musicianProfile?: { avatarUrl: string | null } | null;
};

type ProposalRecord = CollaborationProposal & {
  sender: ProposalSender;
};

type ProposalParticipant = Pick<User, "id" | "name" | "role"> & {
  labelProfile: { companyName: string } | null;
  musicianProfile: { avatarUrl: string | null } | null;
};

type ProposalRecipient = Pick<User, "id" | "name"> & {
  musicianProfile: { avatarUrl: string | null } | null;
};

type ConversationRecord = CollaborationProposal & {
  sender: ProposalParticipant;
  recipient: ProposalParticipant;
};

type SentProposalRecord = CollaborationProposal & {
  recipient: ProposalRecipient;
};

type MessageAuthor = Pick<User, "id" | "name" | "role"> & {
  labelProfile: { companyName: string } | null;
  musicianProfile: { avatarUrl: string | null } | null;
};

type MessageRecord = ProposalMessage & {
  author: MessageAuthor;
};

export function authorDisplayName(author: MessageAuthor) {
  return author.labelProfile?.companyName?.trim() || author.name;
}

export function toPublicProposal(proposal: ProposalRecord, viewerId?: string) {
  return {
    id: proposal.id,
    subject: proposal.subject,
    message: proposal.message,
    linkUrl: proposal.linkUrl,
    status: proposal.status,
    readAt: proposal.readAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    unreadByMe: viewerId ? isUnreadForUser(proposal, viewerId) : false,
    sender: {
      id: proposal.sender.id,
      name: proposal.sender.name,
      role: proposal.sender.role,
      companyName: proposal.sender.labelProfile?.companyName ?? null,
    },
  };
}

function counterpartFromParticipants(
  proposal: ConversationRecord,
  viewerId: string,
) {
  const counterpart =
    viewerId === proposal.senderId ? proposal.recipient : proposal.sender;

  return {
    id: counterpart.id,
    name: counterpart.name,
    role: counterpart.role,
    avatarUrl: counterpart.musicianProfile?.avatarUrl ?? null,
    companyName: counterpart.labelProfile?.companyName ?? null,
    displayName:
      counterpart.labelProfile?.companyName?.trim() || counterpart.name,
  };
}

export function toInboxConversation(proposal: ConversationRecord, viewerId: string) {
  return {
    id: proposal.id,
    subject: proposal.subject,
    message: proposal.message,
    linkUrl: proposal.linkUrl,
    status: proposal.status,
    readAt: proposal.readAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    lastMessageAt:
      proposal.lastMessageAt?.toISOString() ?? proposal.createdAt.toISOString(),
    unreadByMe: isUnreadForUser(proposal, viewerId),
    direction:
      viewerId === proposal.senderId
        ? ("outgoing" as const)
        : ("incoming" as const),
    counterpart: counterpartFromParticipants(proposal, viewerId),
  };
}

export function toSentProposal(proposal: SentProposalRecord, viewerId?: string) {
  return {
    id: proposal.id,
    subject: proposal.subject,
    message: proposal.message,
    linkUrl: proposal.linkUrl,
    status: proposal.status,
    readAt: proposal.readAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    unreadByMe: viewerId ? isUnreadForUser(proposal, viewerId) : false,
    recipient: {
      id: proposal.recipient.id,
      name: proposal.recipient.name,
      avatarUrl: proposal.recipient.musicianProfile?.avatarUrl ?? null,
    },
  };
}

export function toPublicProposalMessage(message: MessageRecord) {
  return {
    id: message.id,
    authorId: message.authorId,
    authorName: authorDisplayName(message.author),
    authorRole: message.author.role,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };
}

type ProposalThreadRecord = CollaborationProposal & {
  sender: MessageAuthor;
  recipient: MessageAuthor;
  messages: MessageRecord[];
};

export function toProposalThread(proposal: ProposalThreadRecord, viewerId: string) {
  const counterpart =
    viewerId === proposal.senderId ? proposal.recipient : proposal.sender;

  return {
    id: proposal.id,
    subject: proposal.subject,
    linkUrl: proposal.linkUrl,
    status: proposal.status,
    unreadByMe: isUnreadForUser(proposal, viewerId),
    counterpart: {
      id: counterpart.id,
      name: counterpart.name,
      avatarUrl: counterpart.musicianProfile?.avatarUrl ?? null,
      companyName: counterpart.labelProfile?.companyName ?? null,
      displayName:
        counterpart.labelProfile?.companyName?.trim() || counterpart.name,
    },
    messages: proposal.messages.map(toPublicProposalMessage),
  };
}
