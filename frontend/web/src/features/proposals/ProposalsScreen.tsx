import { useEffect, useState, type ReactNode } from "react";

import { api, type ApiProposalConversation, type ApiUser } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { ProposalThread } from "./ProposalThread";
import "./proposals.css";

export function ProposalsScreen() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return <ConversationsView user={user} />;
}

function ConversationsView(props: { user: ApiUser }) {
  const [proposals, setProposals] = useState<ApiProposalConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProposals();
  }, []);

  async function loadProposals() {
    try {
      setIsLoading(true);
      setError("");
      const result = await api.getProposals();
      setProposals(result.proposals);
      setSelectedId((current) => current ?? result.proposals[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить переписки");
    } finally {
      setIsLoading(false);
    }
  }

  function markSelectedRead() {
    if (!selectedId) {
      return;
    }

    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === selectedId
          ? { ...proposal, unreadByMe: false, status: "read" }
          : proposal,
      ),
    );
  }

  return (
    <ProposalsPageShell
      title="Предложения"
      intro="Все ваши переписки: входящие и исходящие сообщения с артистами и лейблами."
      error={error}
      isLoading={isLoading}
      isEmpty={!isLoading && proposals.length === 0}
      emptyHint="Пока нет переписок. Напишите артисту через «Связаться с артистом» в профиле или дождитесь входящего сообщения."
      listLabel="Список переписок"
      items={proposals.map((proposal) => ({
        id: proposal.id,
        subject: proposal.subject,
        meta: proposal.counterpart.displayName,
        createdAt: proposal.lastMessageAt,
        isUnread: proposal.unreadByMe,
        isActive: proposal.id === selectedId,
        onSelect: () => setSelectedId(proposal.id),
      }))}
      detail={
        selectedId ? (
          <ProposalThread
            proposalId={selectedId}
            currentUserId={props.user.id}
            onThreadUpdated={markSelectedRead}
          />
        ) : (
          <p className="proposals-page__hint">Выберите переписку из списка</p>
        )
      }
    />
  );
}

function ProposalsPageShell(props: {
  title: string;
  intro: string;
  error: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyHint: string;
  listLabel: string;
  items: Array<{
    id: string;
    subject: string;
    meta: string;
    createdAt: string;
    isUnread: boolean;
    isActive: boolean;
    onSelect: () => void;
  }>;
  detail: ReactNode;
}) {
  return (
    <main className="app-page proposals-page">
      <h1>{props.title}</h1>
      <p className="app-page__intro">{props.intro}</p>

      {props.error ? <p className="app-page__error">{props.error}</p> : null}
      {props.isLoading ? <p className="proposals-page__hint">Загрузка…</p> : null}
      {props.isEmpty ? <p className="proposals-page__hint">{props.emptyHint}</p> : null}

      {!props.isLoading && props.items.length ? (
        <div className="proposals-layout">
          <section className="proposals-list" aria-label={props.listLabel}>
            {props.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`proposals-list__item ${item.isActive ? "is-active" : ""} ${
                  item.isUnread ? "is-unread" : ""
                }`}
                onClick={item.onSelect}
              >
                <strong>{item.subject}</strong>
                <span>{item.meta}</span>
                <time dateTime={item.createdAt}>{formatProposalDate(item.createdAt)}</time>
              </button>
            ))}
          </section>
          <section className="proposals-detail" aria-label="Переписка по запросу">
            {props.detail}
          </section>
        </div>
      ) : null}
    </main>
  );
}

function formatProposalDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
