import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../roles/role.middleware.js";
import {
  toProposalThread,
  toPublicProposal,
  toPublicProposalMessage,
  toSentProposal,
} from "./proposals.presenter.js";
import {
  proposalParamsSchema,
  sendProposalMessageSchema,
  sendProposalSchema,
} from "./proposals.schemas.js";
import { isUnreadForUser, readFieldForUser } from "./proposals.service.js";
import type {
  ArtistProposalParams,
  ProposalParams,
  SendProposalBody,
  SendProposalMessageBody,
} from "./proposals.types.js";

const proposalSenderInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      role: true,
      labelProfile: {
        select: {
          companyName: true,
        },
      },
    },
  },
} as const;

const proposalRecipientInclude = {
  recipient: {
    select: {
      id: true,
      name: true,
      musicianProfile: {
        select: {
          avatarUrl: true,
        },
      },
    },
  },
} as const;

const proposalMessageAuthorInclude = {
  author: {
    select: {
      id: true,
      name: true,
      role: true,
      labelProfile: {
        select: {
          companyName: true,
        },
      },
      musicianProfile: {
        select: {
          avatarUrl: true,
        },
      },
    },
  },
} as const;

const proposalThreadInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      role: true,
      labelProfile: {
        select: {
          companyName: true,
        },
      },
      musicianProfile: {
        select: {
          avatarUrl: true,
        },
      },
    },
  },
  recipient: {
    select: {
      id: true,
      name: true,
      musicianProfile: {
        select: {
          avatarUrl: true,
        },
      },
    },
  },
  messages: {
    include: proposalMessageAuthorInclude,
    orderBy: {
      createdAt: "asc" as const,
    },
  },
} as const;

function normalizeOptionalUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

async function findParticipantProposal(proposalId: string, userId: string) {
  return prisma.collaborationProposal.findFirst({
    where: {
      id: proposalId,
      OR: [{ senderId: userId }, { recipientId: userId }],
    },
  });
}

async function markProposalReadForUser(proposalId: string, userId: string) {
  const proposal = await prisma.collaborationProposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    return null;
  }

  const readField = readFieldForUser(userId, proposal);
  const now = new Date();

  return prisma.collaborationProposal.update({
    where: { id: proposalId },
    data: {
      [readField]: now,
      ...(userId === proposal.recipientId && proposal.status === "pending"
        ? {
            status: "read",
            readAt: proposal.readAt ?? now,
          }
        : {}),
    },
  });
}

export async function registerProposalRoutes(app: FastifyInstance) {
  app.post<{ Params: ArtistProposalParams; Body: SendProposalBody }>(
    "/profiles/:userId/proposals",
    {
      preHandler: authenticate,
      schema: sendProposalSchema,
    },
    async (request, reply) => {
      if (request.params.userId === request.user.userId) {
        return reply.status(400).send({
          error: "Cannot send a proposal to yourself",
          statusCode: 400,
        });
      }

      const recipient = await prisma.user.findUnique({
        where: { id: request.params.userId },
        select: {
          id: true,
          role: true,
          musicianProfile: {
            select: {
              acceptsProposals: true,
            },
          },
        },
      });

      if (!recipient || recipient.role !== "musician" || !recipient.musicianProfile) {
        return reply.status(404).send({
          error: "Artist not found",
          statusCode: 404,
        });
      }

      if (!recipient.musicianProfile.acceptsProposals) {
        return reply.status(403).send({
          error: "Artist is not accepting collaboration proposals",
          statusCode: 403,
        });
      }

      const messageText = request.body.message.trim();
      const now = new Date();

      const proposal = await prisma.$transaction(async (tx) => {
        const created = await tx.collaborationProposal.create({
          data: {
            senderId: request.user.userId,
            recipientId: recipient.id,
            subject: request.body.subject.trim(),
            message: messageText,
            linkUrl: normalizeOptionalUrl(request.body.linkUrl),
            lastMessageAt: now,
            lastMessageAuthorId: request.user.userId,
            messages: {
              create: {
                authorId: request.user.userId,
                text: messageText,
                createdAt: now,
              },
            },
          },
          include: proposalSenderInclude,
        });

        return created;
      });

      return {
        proposal: toPublicProposal(proposal, request.user.userId),
      };
    },
  );

  app.get(
    "/profile/me/proposals/unread-count",
    {
      preHandler: authenticate,
    },
    async (request) => {
      const proposals = await prisma.collaborationProposal.findMany({
        where: {
          OR: [
            { recipientId: request.user.userId },
            { senderId: request.user.userId },
          ],
        },
        select: {
          senderId: true,
          recipientId: true,
          status: true,
          lastMessageAt: true,
          lastMessageAuthorId: true,
          lastReadBySenderAt: true,
          lastReadByRecipientAt: true,
        },
      });

      const unreadCount = proposals.filter((proposal) =>
        isUnreadForUser(proposal, request.user.userId),
      ).length;

      return { unreadCount };
    },
  );

  app.get(
    "/profile/me/proposals",
    {
      preHandler: [authenticate, requireRole("musician")],
    },
    async (request) => {
      const proposals = await prisma.collaborationProposal.findMany({
        where: {
          recipientId: request.user.userId,
        },
        include: proposalSenderInclude,
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        proposals: proposals.map((proposal) =>
          toPublicProposal(proposal, request.user.userId),
        ),
      };
    },
  );

  app.get(
    "/profile/me/proposals/sent",
    {
      preHandler: authenticate,
    },
    async (request) => {
      const proposals = await prisma.collaborationProposal.findMany({
        where: {
          senderId: request.user.userId,
        },
        include: proposalRecipientInclude,
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        proposals: proposals.map((proposal) =>
          toSentProposal(proposal, request.user.userId),
        ),
      };
    },
  );

  app.get<{ Params: ProposalParams }>(
    "/profile/me/proposals/:proposalId/thread",
    {
      preHandler: authenticate,
      schema: proposalParamsSchema,
    },
    async (request, reply) => {
      const participant = await findParticipantProposal(
        request.params.proposalId,
        request.user.userId,
      );

      if (!participant) {
        return reply.status(404).send({
          error: "Proposal not found",
          statusCode: 404,
        });
      }

      await markProposalReadForUser(request.params.proposalId, request.user.userId);

      const proposal = await prisma.collaborationProposal.findUnique({
        where: { id: request.params.proposalId },
        include: proposalThreadInclude,
      });

      if (!proposal) {
        return reply.status(404).send({
          error: "Proposal not found",
          statusCode: 404,
        });
      }

      return {
        thread: toProposalThread(proposal, request.user.userId),
      };
    },
  );

  app.post<{ Params: ProposalParams; Body: SendProposalMessageBody }>(
    "/profile/me/proposals/:proposalId/messages",
    {
      preHandler: authenticate,
      schema: sendProposalMessageSchema,
    },
    async (request, reply) => {
      const participant = await findParticipantProposal(
        request.params.proposalId,
        request.user.userId,
      );

      if (!participant) {
        return reply.status(404).send({
          error: "Proposal not found",
          statusCode: 404,
        });
      }

      const now = new Date();
      const text = request.body.text.trim();

      const message = await prisma.$transaction(async (tx) => {
        const created = await tx.proposalMessage.create({
          data: {
            proposalId: request.params.proposalId,
            authorId: request.user.userId,
            text,
            createdAt: now,
          },
          include: proposalMessageAuthorInclude,
        });

        await tx.collaborationProposal.update({
          where: { id: request.params.proposalId },
          data: {
            lastMessageAt: now,
            lastMessageAuthorId: request.user.userId,
            updatedAt: now,
            ...(request.user.userId === participant.recipientId
              ? {
                  status: "read",
                  readAt: participant.readAt ?? now,
                }
              : {}),
          },
        });

        return created;
      });

      return {
        message: toPublicProposalMessage(message),
      };
    },
  );

  app.patch<{ Params: ProposalParams }>(
    "/profile/me/proposals/:proposalId",
    {
      preHandler: [authenticate, requireRole("musician")],
      schema: proposalParamsSchema,
    },
    async (request, reply) => {
      const existing = await findParticipantProposal(
        request.params.proposalId,
        request.user.userId,
      );

      if (!existing || existing.recipientId !== request.user.userId) {
        return reply.status(404).send({
          error: "Proposal not found",
          statusCode: 404,
        });
      }

      await markProposalReadForUser(request.params.proposalId, request.user.userId);

      const proposal = await prisma.collaborationProposal.findUnique({
        where: { id: existing.id },
        include: proposalSenderInclude,
      });

      if (!proposal) {
        return reply.status(404).send({
          error: "Proposal not found",
          statusCode: 404,
        });
      }

      return {
        proposal: toPublicProposal(proposal, request.user.userId),
      };
    },
  );
}
