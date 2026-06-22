import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../roles/role.middleware.js";
import { toPublicProposal } from "./proposals.presenter.js";
import {
  proposalParamsSchema,
  sendProposalSchema,
} from "./proposals.schemas.js";
import type {
  ArtistProposalParams,
  ProposalParams,
  SendProposalBody,
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

function normalizeOptionalUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
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

      const proposal = await prisma.collaborationProposal.create({
        data: {
          senderId: request.user.userId,
          recipientId: recipient.id,
          subject: request.body.subject.trim(),
          message: request.body.message.trim(),
          linkUrl: normalizeOptionalUrl(request.body.linkUrl),
        },
        include: proposalSenderInclude,
      });

      return {
        proposal: toPublicProposal(proposal),
      };
    },
  );

  app.get(
    "/profile/me/proposals/unread-count",
    {
      preHandler: [authenticate, requireRole("musician")],
    },
    async (request) => {
      const unreadCount = await prisma.collaborationProposal.count({
        where: {
          recipientId: request.user.userId,
          status: "pending",
        },
      });

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
        proposals: proposals.map(toPublicProposal),
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
      const existing = await prisma.collaborationProposal.findFirst({
        where: {
          id: request.params.proposalId,
          recipientId: request.user.userId,
        },
      });

      if (!existing) {
        return reply.status(404).send({
          error: "Proposal not found",
          statusCode: 404,
        });
      }

      const proposal = await prisma.collaborationProposal.update({
        where: { id: existing.id },
        data: {
          status: "read",
          readAt: existing.readAt ?? new Date(),
        },
        include: proposalSenderInclude,
      });

      return {
        proposal: toPublicProposal(proposal),
      };
    },
  );
}
