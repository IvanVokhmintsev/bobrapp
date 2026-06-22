import type { CollaborationProposal, ProposalMessage, User } from "@prisma/client";

import { isUnreadForUser } from "./proposals.service.js";

type ProposalSender = Pick<User, "id" | "name" | "role"> & {
  labelProfile: { companyName: string } | null;
  musicianProfile?: { avatarUrl: string | null } | null;
};

type ProposalRecord = CollaborationProposal & {
  sender: ProposalSender;
};

type ProposalRecipient = Pick<User, "id" | "name"> & {
  musicianProfile: { avatarUrl: string | null } | null;
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
  recipient: Pick<User, "id" | "name"> & {
    musicianProfile: { avatarUrl: string | null } | null;
  };
  messages: MessageRecord[];
};

export function toProposalThread(proposal: ProposalThreadRecord, viewerId: string) {
  const counterpart =
    viewerId === proposal.senderId
      ? {
          id: proposal.recipient.id,
          name: proposal.recipient.name,
          avatarUrl: proposal.recipient.musicianProfile?.avatarUrl ?? null,
          companyName: null as string | null,
        }
      : {
          id: proposal.sender.id,
          name: proposal.sender.name,
          avatarUrl: proposal.sender.musicianProfile?.avatarUrl ?? null,
          companyName: proposal.sender.labelProfile?.companyName ?? null,
        };

  return {
    id: proposal.id,
    subject: proposal.subject,
    linkUrl: proposal.linkUrl,
    status: proposal.status,
    unreadByMe: isUnreadForUser(proposal, viewerId),
    counterpart: {
      ...counterpart,
      displayName: counterpart.companyName?.trim() || counterpart.name,
    },
    messages: proposal.messages.map(toPublicProposalMessage),
  };
}
