import { useState } from "react";

import type { ApiPost } from "../../api";

type FeedPostEditSheetProps = {
  post: ApiPost;
  onClose: () => void;
  onSave: (text: string) => Promise<void>;
};

export function FeedPostEditSheet(props: FeedPostEditSheetProps) {
  const [text, setText] = useState(props.post.text);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    const trimmed = text.trim();

    if (!trimmed) {
      setError("Текст поста не может быть пустым");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await props.onSave(trimmed);
      props.onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="feed-post-edit" role="dialog" aria-label="Редактирование поста">
      <div className="feed-post-edit__backdrop" onClick={props.onClose} />
      <section className="feed-post-edit__panel">
        <div className="feed-post-edit__header">
          <h2>Редактировать пост</h2>
          <button type="button" onClick={props.onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="feed-post-edit__body">
          <label>
            Текст
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              maxLength={2000}
            />
          </label>
          {error ? <p className="feed-post-edit__error">{error}</p> : null}
        </div>
        <footer className="feed-post-edit__footer">
          <button type="button" onClick={props.onClose}>
            Отмена
          </button>
          <button type="button" disabled={isSaving} onClick={() => void save()}>
            {isSaving ? "Сохранение…" : "Сохранить"}
          </button>
        </footer>
      </section>
    </div>
  );
}
