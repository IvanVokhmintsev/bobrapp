import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { api, type ApiProposal } from "../../api";
import { useAuth } from "../../context/AuthContext";
import "./proposals.css";

export function ProposalsScreen() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProposals() {
    try {
      setIsLoading(true);
      setError("");
      const result = await api.getProposals();
      setProposals(result.proposals);
      if (result.proposals.length && !selectedId) {
        setSelectedId(result.proposals[0]?.id ?? null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить предложения");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProposals();
  }, []);

  if (!user) {
    return null;
  }

  if (user.role !== "musician") {
    return <Navigate to="/feed" replace />;
  }

  const selected = proposals.find((proposal) => proposal.id === selectedId) ?? null;

  async function openProposal(proposal: ApiProposal) {
    setSelectedId(proposal.id);

    if (proposal.status === "pending") {
      try {
        const result = await api.markProposalRead(proposal.id);
        setProposals((current) =>
          current.map((item) => (item.id === proposal.id ? result.proposal : item)),
        );
      } catch {
        /* keep list usable */
      }
    }
  }

  return (
    <main className="app-page proposals-page">
      <h1>Предложения</h1>
      <p className="app-page__intro">
        Входящие предложения о сотрудничестве от лейблов и других пользователей платформы.
      </p>

      {error ? <p className="app-page__error">{error}</p> : null}
      {isLoading ? <p className="proposals-page__hint">Загрузка…</p> : null}

      {!isLoading && proposals.length === 0 ? (
        <p className="proposals-page__hint">
          Пока нет входящих предложений. Они появятся, когда кто-то нажмёт «Связаться с артистом» в
          вашем профиле.
        </p>
      ) : null}

      {!isLoading && proposals.length ? (
        <div className="proposals-layout">
          <section className="proposals-list" aria-label="Список предложений">
            {proposals.map((proposal) => {
              const isActive = proposal.id === selectedId;
              const senderLabel =
                proposal.sender.companyName?.trim() || proposal.sender.name;

              return (
                <button
                  key={proposal.id}
                  type="button"
                  className={`proposals-list__item ${isActive ? "is-active" : ""} ${
                    proposal.status === "pending" ? "is-unread" : ""
                  }`}
                  onClick={() => void openProposal(proposal)}
                >
                  <strong>{proposal.subject}</strong>
                  <span>{senderLabel}</span>
                  <time dateTime={proposal.createdAt}>
                    {formatProposalDate(proposal.createdAt)}
                  </time>
                </button>
              );
            })}
          </section>

          <section className="proposals-detail" aria-label="Детали предложения">
            {selected ? (
              <>
                <div className="proposals-detail__header">
                  <div>
                    <h2>{selected.subject}</h2>
                    <p>
                      От:{" "}
                      <Link to={`/profile/${selected.sender.id}`}>
                        {selected.sender.companyName?.trim() || selected.sender.name}
                      </Link>
                    </p>
                    <time dateTime={selected.createdAt}>
                      {formatProposalDate(selected.createdAt)}
                    </time>
                  </div>
                  <span className={`proposals-detail__status proposals-detail__status--${selected.status}`}>
                    {selected.status === "pending" ? "Новое" : "Прочитано"}
                  </span>
                </div>
                <div className="proposals-detail__message">{selected.message}</div>
                {selected.linkUrl ? (
                  <a
                    className="proposals-detail__link"
                    href={selected.linkUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Открыть ссылку
                  </a>
                ) : null}
              </>
            ) : (
              <p className="proposals-page__hint">Выберите предложение из списка</p>
            )}
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
