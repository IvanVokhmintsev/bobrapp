import { useState } from "react";

import type { ApiUser } from "../../api";
import { FeedComposer } from "./FeedChrome";

type FeedNewPostBlockProps = {
  user: ApiUser;
  avatarSrc: string;
  text: string;
  imageFile: File | null;
  audioFile: File | null;
  isPublishing: boolean;
  onTextChange: (value: string) => void;
  onImageChange: (file: File | null) => void;
  onAudioChange: (file: File | null) => void;
  onSubmit: () => Promise<boolean>;
};

export function FeedNewPostBlock(props: FeedNewPostBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit() {
    const published = await props.onSubmit();
    if (published) {
      setIsOpen(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className="feed-compose-trigger"
        onClick={() => setIsOpen(true)}
        aria-expanded={false}
        aria-controls="feed-compose-panel"
      >
        <img className="feed-compose-trigger__avatar" src={props.avatarSrc} alt="" />
        <span className="feed-compose-trigger__label">Новый пост</span>
      </button>
    );
  }

  return (
    <section
      id="feed-compose-panel"
      className="feed-compose-panel"
      aria-label="Создание поста"
    >
      <div className="feed-compose-panel__header">
        <div className="feed-compose-panel__author">
          <img src={props.avatarSrc} alt="" />
          <span>{props.user.name}</span>
        </div>
        <button
          type="button"
          className="feed-compose-panel__close"
          onClick={handleClose}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
      <FeedComposer
        text={props.text}
        imageFile={props.imageFile}
        audioFile={props.audioFile}
        isPublishing={props.isPublishing}
        autoFocus
        onTextChange={props.onTextChange}
        onImageChange={props.onImageChange}
        onAudioChange={props.onAudioChange}
        onSubmit={() => void handleSubmit()}
      />
    </section>
  );
}
