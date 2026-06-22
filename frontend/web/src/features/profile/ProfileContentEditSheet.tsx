import { useState } from "react";

import {
  api,
  type ApiProfileAlbum,
  type ApiProfileConcert,
} from "../../api";
import albumCover from "../../assets/profile/album-cover.png";
import concertPhoto from "../../assets/profile/concert-photo.png";
import { CoverPicker } from "./CoverPicker";

type ProfileContentEditSheetProps = {
  albums: ApiProfileAlbum[];
  concerts: ApiProfileConcert[];
  onClose: () => void;
  onChanged: (next: {
    albums: ApiProfileAlbum[];
    concerts: ApiProfileConcert[];
  }) => void;
};

type Tab = "albums" | "concerts";

export function ProfileContentEditSheet(props: ProfileContentEditSheetProps) {
  const [tab, setTab] = useState<Tab>("albums");
  const [albums, setAlbums] = useState(props.albums);
  const [concerts, setConcerts] = useState(props.concerts);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDate, setAlbumDate] = useState("");
  const [albumCoverUrl, setAlbumCoverUrl] = useState("");
  const [pendingAlbumFile, setPendingAlbumFile] = useState<File | null>(null);
  const [concertVenue, setConcertVenue] = useState("");
  const [concertDate, setConcertDate] = useState("");
  const [concertCoverUrl, setConcertCoverUrl] = useState("");
  const [pendingConcertFile, setPendingConcertFile] = useState<File | null>(null);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingConcertId, setEditingConcertId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function notifyChanged(nextAlbums: ApiProfileAlbum[], nextConcerts: ApiProfileConcert[]) {
    setAlbums(nextAlbums);
    setConcerts(nextConcerts);
    props.onChanged({ albums: nextAlbums, concerts: nextConcerts });
  }

  function resetAlbumForm() {
    setAlbumTitle("");
    setAlbumDate("");
    setAlbumCoverUrl("");
    setPendingAlbumFile(null);
    setEditingAlbumId(null);
  }

  function resetConcertForm() {
    setConcertVenue("");
    setConcertDate("");
    setConcertCoverUrl("");
    setPendingConcertFile(null);
    setEditingConcertId(null);
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

      if (editingAlbumId) {
        const result = await api.updateProfileAlbum(editingAlbumId, {
          title: albumTitle.trim(),
          releaseDate: albumDate || null,
          ...(pendingAlbumFile
            ? {}
            : { coverUrl: albumCoverUrl.trim() || null }),
        });
        savedAlbum = await finalizeAlbumCover(result.album, pendingAlbumFile);
        const nextAlbums = albums.map((album) =>
          album.id === editingAlbumId ? savedAlbum : album,
        );
        notifyChanged(nextAlbums, concerts);
        setNotice("Альбом обновлён");
      } else {
        const result = await api.createProfileAlbum({
          title: albumTitle.trim(),
          releaseDate: albumDate || null,
          coverUrl: pendingAlbumFile ? null : albumCoverUrl.trim() || null,
        });
        savedAlbum = await finalizeAlbumCover(result.album, pendingAlbumFile);
        notifyChanged([savedAlbum, ...albums], concerts);
        setNotice("Альбом добавлен");
      }

      resetAlbumForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить альбом");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAlbum(albumId: string) {
    try {
      setError("");
      await api.deleteProfileAlbum(albumId);
      notifyChanged(
        albums.filter((album) => album.id !== albumId),
        concerts,
      );
      if (editingAlbumId === albumId) {
        resetAlbumForm();
      }
      setNotice("Альбом удалён");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось удалить альбом");
    }
  }

  function startEditAlbum(album: ApiProfileAlbum) {
    setTab("albums");
    setEditingAlbumId(album.id);
    setAlbumTitle(album.title);
    setAlbumDate(album.releaseDate ?? "");
    setAlbumCoverUrl(album.coverUrl ?? "");
    setPendingAlbumFile(null);
    setError("");
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

      if (editingConcertId) {
        const result = await api.updateProfileConcert(editingConcertId, {
          venue: concertVenue.trim(),
          eventDate: concertDate,
          ...(pendingConcertFile
            ? {}
            : { coverUrl: concertCoverUrl.trim() || null }),
        });
        savedConcert = await finalizeConcertCover(result.concert, pendingConcertFile);
        const nextConcerts = concerts.map((concert) =>
          concert.id === editingConcertId ? savedConcert : concert,
        );
        notifyChanged(albums, nextConcerts);
        setNotice("Концерт обновлён");
      } else {
        const result = await api.createProfileConcert({
          venue: concertVenue.trim(),
          eventDate: concertDate,
          coverUrl: pendingConcertFile ? null : concertCoverUrl.trim() || null,
        });
        savedConcert = await finalizeConcertCover(result.concert, pendingConcertFile);
        notifyChanged(albums, [savedConcert, ...concerts]);
        setNotice("Концерт добавлен");
      }

      resetConcertForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить концерт");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeConcert(concertId: string) {
    try {
      setError("");
      await api.deleteProfileConcert(concertId);
      notifyChanged(
        albums,
        concerts.filter((concert) => concert.id !== concertId),
      );
      if (editingConcertId === concertId) {
        resetConcertForm();
      }
      setNotice("Концерт удалён");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось удалить концерт");
    }
  }

  function startEditConcert(concert: ApiProfileConcert) {
    setTab("concerts");
    setEditingConcertId(concert.id);
    setConcertVenue(concert.venue);
    setConcertDate(concert.eventDate);
    setConcertCoverUrl(concert.coverUrl ?? "");
    setPendingConcertFile(null);
    setError("");
  }

  return (
    <div className="profile-edit" role="dialog" aria-label="Альбомы и концерты">
      <div className="profile-edit__backdrop" onClick={props.onClose} />
      <section className="profile-edit__panel profile-content-edit__panel">
        <div className="profile-edit__header">
          <h2>Альбомы и концерты</h2>
          <button type="button" onClick={props.onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="profile-content-edit__tabs">
          <button
            type="button"
            className={tab === "albums" ? "is-active" : undefined}
            onClick={() => setTab("albums")}
          >
            Альбомы ({albums.length})
          </button>
          <button
            type="button"
            className={tab === "concerts" ? "is-active" : undefined}
            onClick={() => setTab("concerts")}
          >
            Концерты ({concerts.length})
          </button>
        </div>

        <div className="profile-edit__body profile-content-edit__body">
          {notice ? <p className="profile-content-edit__notice">{notice}</p> : null}
          {error ? <p className="profile-edit__error">{error}</p> : null}

          {tab === "albums" ? (
            <>
              <div className="profile-content-edit__form">
                <h3>{editingAlbumId ? "Редактировать альбом" : "Новый альбом"}</h3>
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
                  coverUrl={albumCoverUrl}
                  fallback={albumCover}
                  pendingFile={pendingAlbumFile}
                  onCoverUrlChange={setAlbumCoverUrl}
                  onPendingFileChange={setPendingAlbumFile}
                />
                <div className="profile-content-edit__form-actions">
                  {editingAlbumId ? (
                    <button type="button" onClick={resetAlbumForm} disabled={isSaving}>
                      Отмена
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="profile-edit__save"
                    disabled={isSaving}
                    onClick={() => void saveAlbum()}
                  >
                    {isSaving
                      ? "Сохранение…"
                      : editingAlbumId
                        ? "Сохранить"
                        : "Добавить альбом"}
                  </button>
                </div>
              </div>

              <ul className="profile-content-edit__list">
                {albums.length === 0 ? (
                  <li className="profile-content-edit__empty">Альбомов пока нет</li>
                ) : (
                  albums.map((album) => (
                    <li key={album.id}>
                      <div>
                        <strong>{album.title}</strong>
                        <span>{album.releaseDate ?? "без даты"}</span>
                      </div>
                      <div className="profile-content-edit__item-actions">
                        <button type="button" onClick={() => startEditAlbum(album)}>
                          Изменить
                        </button>
                        <button type="button" onClick={() => void removeAlbum(album.id)}>
                          Удалить
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : (
            <>
              <div className="profile-content-edit__form">
                <h3>{editingConcertId ? "Редактировать концерт" : "Новый концерт"}</h3>
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
                  coverUrl={concertCoverUrl}
                  fallback={concertPhoto}
                  pendingFile={pendingConcertFile}
                  onCoverUrlChange={setConcertCoverUrl}
                  onPendingFileChange={setPendingConcertFile}
                />
                <div className="profile-content-edit__form-actions">
                  {editingConcertId ? (
                    <button type="button" onClick={resetConcertForm} disabled={isSaving}>
                      Отмена
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="profile-edit__save"
                    disabled={isSaving}
                    onClick={() => void saveConcert()}
                  >
                    {isSaving
                      ? "Сохранение…"
                      : editingConcertId
                        ? "Сохранить"
                        : "Добавить концерт"}
                  </button>
                </div>
              </div>

              <ul className="profile-content-edit__list">
                {concerts.length === 0 ? (
                  <li className="profile-content-edit__empty">Концертов пока нет</li>
                ) : (
                  concerts.map((concert) => (
                    <li key={concert.id}>
                      <div>
                        <strong>{concert.venue}</strong>
                        <span>{concert.eventDate}</span>
                      </div>
                      <div className="profile-content-edit__item-actions">
                        <button type="button" onClick={() => startEditConcert(concert)}>
                          Изменить
                        </button>
                        <button type="button" onClick={() => void removeConcert(concert.id)}>
                          Удалить
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
