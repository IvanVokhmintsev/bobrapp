import { useState } from "react";

import { api, type ApiUser } from "../../api";
import type { ProfileBlockStatus } from "../../lib/profileCompleteness";
import "../proposals/proposals.css";

type ContactProposalSheetProps = {
  artist: ApiUser;
  incompleteBlocks: ProfileBlockStatus[];
  onClose: () => void;
  onSent: () => void;
};

export function ContactProposalSheet(props: ContactProposalSheetProps) {
  const [subject, setSubject] = useState("Предложение о сотрудничестве");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const incomplete = props.incompleteBlocks.filter((block) => !block.filled);

  async function submit() {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      setError("Заполните тему и текст предложения");
      return;
    }

    try {
      setIsSending(true);
      setError("");
      await api.sendProposal(props.artist.id, {
        subject: trimmedSubject,
        message: trimmedMessage,
        linkUrl: linkUrl.trim() || undefined,
      });
      props.onSent();
      props.onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить предложение");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="profile-edit" role="dialog" aria-label="Связаться с артистом">
      <div className="profile-edit__backdrop" onClick={props.onClose} />
      <section className="profile-edit__panel">
        <div className="profile-edit__header">
          <h2>Связаться с артистом</h2>
          <button type="button" onClick={props.onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="profile-edit__body">
          <p className="contact-proposal__intro">
            Отправьте предложение о сотрудничестве для{" "}
            <strong>{props.artist.name}</strong>. Артист получит его во входящих.
          </p>

          {incomplete.length ? (
            <div className="contact-proposal__warning" role="note">
              <strong>Профиль артиста заполнен не полностью:</strong>
              <ul>
                {incomplete.map((block) => (
                  <li key={block.id}>{block.label}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <label>
            Тема
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={120}
              required
            />
          </label>
          <label>
            Сообщение
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="Опишите формат сотрудничества, условия и следующий шаг"
              required
            />
          </label>
          <label>
            Ссылка (необязательно)
            <input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              maxLength={500}
              placeholder="https://"
            />
          </label>
          {error ? <p className="profile-edit__error">{error}</p> : null}
        </div>
        <footer className="profile-edit__footer">
          <button
            type="button"
            className="profile-edit__save"
            disabled={isSending}
            onClick={() => void submit()}
          >
            {isSending ? "Отправка…" : "Отправить предложение"}
          </button>
        </footer>
      </section>
    </div>
  );
}
