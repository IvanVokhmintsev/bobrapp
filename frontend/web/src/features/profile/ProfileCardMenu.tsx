import { useEffect, useRef, useState } from "react";

import type { ApiUser } from "../../api";
import { getProfilePath } from "../../lib/profilePath";

type ProfileCardMenuProps = {
  profileUser: ApiUser;
  currentUserId: string;
  isOwnProfile: boolean;
  onFavorite?: () => void;
  onEdit?: () => void;
};

export function ProfileCardMenu(props: ProfileCardMenuProps) {
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
    const url = `${window.location.origin}${getProfilePath(
      props.profileUser.id,
      props.currentUserId,
    )}`;

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
    props.onFavorite?.();
    setOpen(false);
  }

  function handleEdit() {
    props.onEdit?.();
    setOpen(false);
  }

  return (
    <div
      ref={menuRef}
      className={`profile-card__menu ${open ? "is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="profile-card__menu-trigger"
        aria-label="Меню профиля"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="profile-card__menu-dropdown">
        <div className="profile-card__menu-dropdown-panel" role="menu">
          {!props.isOwnProfile && props.onFavorite ? (
            <button type="button" role="menuitem" onClick={handleFavorite}>
              {props.profileUser.favoritedByMe
                ? "Убрать из избранного"
                : "Добавить в избранное"}
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={() => void copyLink()}>
            {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
          </button>
          {props.isOwnProfile && props.onEdit ? (
            <button type="button" role="menuitem" onClick={handleEdit}>
              Редактировать
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
