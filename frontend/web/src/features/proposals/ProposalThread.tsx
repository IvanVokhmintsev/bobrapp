import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { api, type ApiProposalThread } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import { resolveAvatarUrl } from "../../lib/avatarUrl";

type ProposalThreadProps = {
  proposalId: string;
  currentUserId: string;
  onThreadUpdated?: () => void;
};

export function ProposalThread(props: ProposalThreadProps) {
  const [thread, setThread] = useState<ApiProposalThread | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadThread();
  }, [props.proposalId]);

  useEffect(() => {
    const container = messagesRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [thread?.messages.length]);

  async function loadThread() {
    try {
      setIsLoading(true);
      setError("");
      const result = await api.getProposalThread(props.proposalId);
      setThread(result.thread);
      props.onThreadUpdated?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить переписку");
      setThread(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    const text = draft.trim();

    if (!text) {
      setError("Введите сообщение");
      return;
    }

    try {
      setIsSending(true);
      setError("");
      const result = await api.sendProposalMessage(props.proposalId, { text });
      setDraft("");
      setThread((current) =>
        current
          ? {
              ...current,
              unreadByMe: false,
              messages: [...current.messages, result.message],
            }
          : current,
      );
      props.onThreadUpdated?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить сообщение");
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return <p className="proposals-page__hint">Загрузка переписки…</p>;
  }

  if (!thread) {
    return error ? <p className="app-page__error">{error}</p> : null;
  }

  const avatarSrc = resolveAvatarUrl(thread.counterpart.avatarUrl, defaultAvatar);

  return (
    <div className="proposal-thread">
      <div className="proposals-detail__header">
        <div>
          <h2>{thread.subject}</h2>
          <p className="proposals-detail__counterpart">
            <img src={avatarSrc} alt="" />
            <span>
              <Link to={`/profile/${thread.counterpart.id}`}>
                {thread.counterpart.displayName}
              </Link>
            </span>
          </p>
        </div>
        <span
          className={`proposals-detail__status proposals-detail__status--${
            thread.status === "read" ? "read" : "pending"
          }`}
        >
          {thread.status === "read" ? "В переписке" : "Новый запрос"}
        </span>
      </div>

      {thread.linkUrl ? (
        <a
          className="proposals-detail__link proposal-thread__initial-link"
          href={thread.linkUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          Ссылка из первого сообщения
        </a>
      ) : null}

      <div className="proposal-thread__messages" ref={messagesRef} aria-label="Переписка">
        {thread.messages.map((message) => {
          const isMine = message.authorId === props.currentUserId;

          return (
            <article
              key={message.id}
              className={`proposal-thread__message ${isMine ? "is-mine" : "is-theirs"}`}
            >
              <div className="proposal-thread__bubble">
                {!isMine ? (
                  <span className="proposal-thread__author">{message.authorName}</span>
                ) : null}
                <p>{message.text}</p>
                <time dateTime={message.createdAt}>
                  {formatThreadTime(message.createdAt)}
                </time>
              </div>
            </article>
          );
        })}
      </div>

      <form
        className="proposal-thread__composer"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
      >
        <label className="visually-hidden" htmlFor={`proposal-reply-${props.proposalId}`}>
          Ответ
        </label>
        <textarea
          id={`proposal-reply-${props.proposalId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Напишите ответ…"
        />
        {error ? <p className="profile-edit__error">{error}</p> : null}
        <button type="submit" className="profile-edit__save" disabled={isSending}>
          {isSending ? "Отправка…" : "Отправить"}
        </button>
      </form>
    </div>
  );
}

function formatThreadTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
