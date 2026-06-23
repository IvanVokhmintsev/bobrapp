import { useEffect, useRef, useState } from "react";

import type { ApiPost } from "../../api";
import { getProfilePath } from "../../lib/profilePath";

type FeedPostMenuProps = {
  post: ApiPost;
  currentUserId: string;
  isOwnPost: boolean;
  onFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function FeedPostMenu(props: FeedPostMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function copyLink() {
    const profilePath = getProfilePath(props.post.author.id, props.currentUserId);
    const url = `${window.location.origin}${profilePath}#post-${props.post.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }

    setOpen(false);
  }

  function handleFavorite() {
    props.onFavorite();
    setOpen(false);
  }

  function handleEdit() {
    props.onEdit?.();
    setOpen(false);
  }

  function handleDelete() {
    if (!window.confirm("Удалить этот пост?")) {
      return;
    }

    props.onDelete?.();
    setOpen(false);
  }

  return (
    <div
      ref={menuRef}
      className={`feed-card__menu ${open ? "is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="feed-card__menu-trigger"
        aria-label="Меню поста"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="feed-card__menu-dropdown">
        <div className="feed-card__menu-dropdown-panel" role="menu">
          <button type="button" role="menuitem" onClick={() => void handleFavorite()}>
            {props.post.favoritedByMe ? "Убрать из избранного" : "Добавить в избранное"}
          </button>
          <button type="button" role="menuitem" onClick={() => void copyLink()}>
            {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
          </button>
          {props.isOwnPost && props.onEdit ? (
            <button type="button" role="menuitem" onClick={handleEdit}>
              Редактировать
            </button>
          ) : null}
          {props.isOwnPost && props.onDelete ? (
            <button
              type="button"
              role="menuitem"
              className="feed-card__menu-item--danger"
              onClick={handleDelete}
            >
              Удалить
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
