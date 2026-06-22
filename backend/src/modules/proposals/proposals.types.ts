export type SendProposalBody = {
  subject: string;
  message: string;
  linkUrl?: string;
};

export type ProposalParams = {
  proposalId: string;
};

export type ArtistProposalParams = {
  userId: string;
};
