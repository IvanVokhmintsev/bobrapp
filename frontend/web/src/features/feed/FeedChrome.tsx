import { useRef } from "react";

import attachAudioIcon from "../../assets/feed/attach-audio.svg";
import attachPhotoIcon from "../../assets/feed/attach-photo.svg";
import sendArrowIcon from "../../assets/feed/send-arrow.svg";

export function FeedComposer(props: {
  text: string;
  imageFile: File | null;
  audioFile: File | null;
  onTextChange: (value: string) => void;
  onImageChange: (file: File | null) => void;
  onAudioChange: (file: File | null) => void;
  onSubmit: () => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="feed-composer" aria-label="Новый пост">
      <textarea
        value={props.text}
        onChange={(event) => props.onTextChange(event.target.value)}
        placeholder="Введите текст"
        rows={3}
      />

      {props.imageFile || props.audioFile ? (
        <div className="feed-composer__attachments" aria-label="Вложения">
          {props.imageFile ? (
            <span className="feed-composer__attachment">
              Фото: {props.imageFile.name}
              <button
                type="button"
                onClick={() => props.onImageChange(null)}
                aria-label="Убрать фото"
              >
                ×
              </button>
            </span>
          ) : null}
          {props.audioFile ? (
            <span className="feed-composer__attachment">
              Аудио: {props.audioFile.name}
              <button
                type="button"
                onClick={() => props.onAudioChange(null)}
                aria-label="Убрать аудио"
              >
                ×
              </button>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="feed-composer__toolbar">
        <div className="feed-composer__tools">
          <button
            type="button"
            className={`feed-composer__tool ${props.imageFile ? "is-active" : ""}`}
            onClick={() => imageInputRef.current?.click()}
          >
            <img src={attachPhotoIcon} alt="" />
            <span>Фото</span>
          </button>
          <button
            type="button"
            className={`feed-composer__tool ${props.audioFile ? "is-active" : ""}`}
            onClick={() => audioInputRef.current?.click()}
          >
            <img src={attachAudioIcon} alt="" />
            <span>Аудио</span>
          </button>
        </div>
        <button
          type="button"
          className="feed-composer__send"
          onClick={props.onSubmit}
          aria-label="Опубликовать"
        >
          <img src={sendArrowIcon} alt="" />
        </button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          props.onImageChange(file);
          event.target.value = "";
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          props.onAudioChange(file);
          event.target.value = "";
        }}
      />
    </section>
  );
}
