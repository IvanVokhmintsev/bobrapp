import type { CollaborationProposal, User } from "@prisma/client";

type ProposalSender = Pick<User, "id" | "name" | "role"> & {
  labelProfile: { companyName: string } | null;
};

type ProposalRecord = CollaborationProposal & {
  sender: ProposalSender;
};

export function toPublicProposal(proposal: ProposalRecord) {
  return {
    id: proposal.id,
    subject: proposal.subject,
    message: proposal.message,
    linkUrl: proposal.linkUrl,
    status: proposal.status,
    readAt: proposal.readAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    sender: {
      id: proposal.sender.id,
      name: proposal.sender.name,
      role: proposal.sender.role,
      companyName: proposal.sender.labelProfile?.companyName ?? null,
    },
  };
}
