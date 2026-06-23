import { useEffect, useState } from "react";

import {
  api,
  type ApiProfileAlbum,
  type ApiProfileConcert,
} from "../../api";
import { CoverPicker } from "./CoverPicker";

export type ProfileContentEditKind = "albums" | "concerts";

type ProfileContentEditSheetProps = {
  kind: ProfileContentEditKind;
  itemId: string | null;
  albums: ApiProfileAlbum[];
  concerts: ApiProfileConcert[];
  onClose: () => void;
  onChanged: (
    next: {
      albums: ApiProfileAlbum[];
      concerts: ApiProfileConcert[];
    },
    action: "create" | "update" | "delete",
  ) => void;
};

export function ProfileContentEditSheet(props: ProfileContentEditSheetProps) {
  const isAlbums = props.kind === "albums";
  const editingAlbum =
    isAlbums && props.itemId
      ? props.albums.find((album) => album.id === props.itemId) ?? null
      : null;
  const editingConcert =
    !isAlbums && props.itemId
      ? props.concerts.find((concert) => concert.id === props.itemId) ?? null
      : null;
  const isEditing = Boolean(props.itemId);

  const [albums, setAlbums] = useState(props.albums);
  const [concerts, setConcerts] = useState(props.concerts);
  const [albumTitle, setAlbumTitle] = useState(editingAlbum?.title ?? "");
  const [albumDate, setAlbumDate] = useState(editingAlbum?.releaseDate ?? "");
  const [pendingAlbumFile, setPendingAlbumFile] = useState<File | null>(null);
  const [concertVenue, setConcertVenue] = useState(editingConcert?.venue ?? "");
  const [concertDate, setConcertDate] = useState(editingConcert?.eventDate ?? "");
  const [pendingConcertFile, setPendingConcertFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAlbums(props.albums);
    setConcerts(props.concerts);
  }, [props.albums, props.concerts]);

  useEffect(() => {
    setAlbumTitle(editingAlbum?.title ?? "");
    setAlbumDate(editingAlbum?.releaseDate ?? "");
    setPendingAlbumFile(null);
    setConcertVenue(editingConcert?.venue ?? "");
    setConcertDate(editingConcert?.eventDate ?? "");
    setPendingConcertFile(null);
    setError("");
  }, [editingAlbum, editingConcert, props.itemId, props.kind]);

  function notifyChanged(
    nextAlbums: ApiProfileAlbum[],
    nextConcerts: ApiProfileConcert[],
    action: "create" | "update" | "delete",
  ) {
    setAlbums(nextAlbums);
    setConcerts(nextConcerts);
    props.onChanged({ albums: nextAlbums, concerts: nextConcerts }, action);
  }

  async function finalizeAlbumCover(album: ApiProfileAlbum, pendingFile: File | null) {
    if (!pendingFile) {
      return album;
    }

    const uploaded = await api.uploadProfileAlbumCover(album.id, pendingFile);
    return uploaded.album;
  }

  async function finalizeConcertCover(
    concert: ApiProfileConcert,
    pendingFile: File | null,
  ) {
    if (!pendingFile) {
      return concert;
    }

    const uploaded = await api.uploadProfileConcertCover(concert.id, pendingFile);
    return uploaded.concert;
  }

  async function saveAlbum() {
    if (!albumTitle.trim()) {
      setError("Укажите название альбома");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      let savedAlbum: ApiProfileAlbum;

      if (props.itemId) {
        const result = await api.updateProfileAlbum(props.itemId, {
          title: albumTitle.trim(),
          releaseDate: albumDate || null,
        });
        savedAlbum = await finalizeAlbumCover(result.album, pendingAlbumFile);
        const nextAlbums = albums.map((album) =>
          album.id === props.itemId ? savedAlbum : album,
        );
        notifyChanged(nextAlbums, concerts, "update");
      } else {
        const result = await api.createProfileAlbum({
          title: albumTitle.trim(),
          releaseDate: albumDate || null,
          coverUrl: null,
        });
        savedAlbum = await finalizeAlbumCover(result.album, pendingAlbumFile);
        notifyChanged([savedAlbum, ...albums], concerts, "create");
      }

      props.onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить альбом");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAlbum() {
    if (!props.itemId) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await api.deleteProfileAlbum(props.itemId);
      notifyChanged(
        albums.filter((album) => album.id !== props.itemId),
        concerts,
        "delete",
      );
      props.onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось удалить альбом");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveConcert() {
    if (!concertVenue.trim()) {
      setError("Укажите площадку концерта");
      return;
    }

    if (!concertDate) {
      setError("Укажите дату концерта");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      let savedConcert: ApiProfileConcert;

      if (props.itemId) {
        const result = await api.updateProfileConcert(props.itemId, {
          venue: concertVenue.trim(),
          eventDate: concertDate,
        });
        savedConcert = await finalizeConcertCover(result.concert, pendingConcertFile);
        const nextConcerts = concerts.map((concert) =>
          concert.id === props.itemId ? savedConcert : concert,
        );
        notifyChanged(albums, nextConcerts, "update");
      } else {
        const result = await api.createProfileConcert({
          venue: concertVenue.trim(),
          eventDate: concertDate,
          coverUrl: null,
        });
        savedConcert = await finalizeConcertCover(result.concert, pendingConcertFile);
        notifyChanged(albums, [savedConcert, ...concerts], "create");
      }

      props.onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить концерт");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeConcert() {
    if (!props.itemId) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await api.deleteProfileConcert(props.itemId);
      notifyChanged(
        albums,
        concerts.filter((concert) => concert.id !== props.itemId),
        "delete",
      );
      props.onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось удалить концерт");
    } finally {
      setIsSaving(false);
    }
  }

  const title = isAlbums ? "Альбомы" : "Концерты";
  const formTitle = isEditing
    ? isAlbums
      ? "Редактировать альбом"
      : "Редактировать концерт"
    : isAlbums
      ? "Новый альбом"
      : "Новый концерт";

  return (
    <div className="profile-edit" role="dialog" aria-label={title}>
      <div className="profile-edit__backdrop" onClick={props.onClose} />
      <section className="profile-edit__panel profile-content-edit__panel">
        <div className="profile-edit__header">
          <h2>{title}</h2>
          <button type="button" onClick={props.onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="profile-edit__body profile-content-edit__body">
          {error ? <p className="profile-edit__error">{error}</p> : null}

          <div className="profile-content-edit__form">
            <h3>{formTitle}</h3>

            {isAlbums ? (
              <>
                <label>
                  Название
                  <input
                    value={albumTitle}
                    onChange={(event) => setAlbumTitle(event.target.value)}
                  />
                </label>
                <label>
                  Дата релиза
                  <input
                    type="date"
                    value={albumDate}
                    onChange={(event) => setAlbumDate(event.target.value)}
                  />
                </label>
                <CoverPicker
                  label="Обложка"
                  coverUrl={editingAlbum?.coverUrl}
                  pendingFile={pendingAlbumFile}
                  onPendingFileChange={setPendingAlbumFile}
                />
              </>
            ) : (
              <>
                <label>
                  Площадка
                  <input
                    value={concertVenue}
                    onChange={(event) => setConcertVenue(event.target.value)}
                    placeholder='СК "Олимпийский"'
                  />
                </label>
                <label>
                  Дата
                  <input
                    type="date"
                    value={concertDate}
                    onChange={(event) => setConcertDate(event.target.value)}
                  />
                </label>
                <CoverPicker
                  label="Фото концерта"
                  coverUrl={editingConcert?.coverUrl}
                  pendingFile={pendingConcertFile}
                  onPendingFileChange={setPendingConcertFile}
                />
              </>
            )}

            <div className="profile-content-edit__form-actions">
              {isEditing ? (
                <button
                  type="button"
                  className="profile-content-edit__delete"
                  disabled={isSaving}
                  onClick={() => void (isAlbums ? removeAlbum() : removeConcert())}
                >
                  Удалить
                </button>
              ) : null}
              <button
                type="button"
                className="profile-edit__save"
                disabled={isSaving}
                onClick={() => void (isAlbums ? saveAlbum() : saveConcert())}
              >
                {isSaving ? "Сохранение…" : isEditing ? "Сохранить" : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
