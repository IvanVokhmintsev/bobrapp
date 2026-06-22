import { useState } from "react";

import { useAuth } from "../../context/AuthContext";
import defaultAvatar from "../../assets/feed/card-cover.png";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { FeedNewPostBlock } from "./FeedNewPostBlock";
import { FeedFiltersPanel, type FeedPostTypeFilter } from "./FeedFiltersPanel";
import { FeedLabelPanel } from "./FeedLabelPanel";
import { FeedPostStream } from "./FeedPostStream";
import "./feed.css";
import "./feed-label.css";
import { useFeedInteractions } from "./useFeedInteractions";

export function FeedScreen() {
  const { user } = useAuth();
  const [postTypeFilter, setPostTypeFilter] = useState<FeedPostTypeFilter>("all");
  const feed = useFeedInteractions({ postType: postTypeFilter });

  if (!user) {
    return null;
  }

  const avatarSrc = resolveAvatarUrl(user.musicianProfile?.avatarUrl, defaultAvatar);
  const isMusician = user.role === "musician";
  const isLabel = user.role === "label";

  return (
    <div className="feed-page">
      <main className="feed__main">
        {feed.error ? <p className="feed__error">{feed.error}</p> : null}
        {feed.isLoadingPosts && feed.posts.length === 0 ? (
          <p className="feed__empty">Загрузка ленты…</p>
        ) : null}

        <FeedPostStream
          feed={feed}
          currentUser={user}
          ariaLabel="Лента постов"
          showEmpty={!feed.isLoadingPosts}
          emptyMessage="В ленте пока нет постов. Будьте первым!"
          showLoadMore
          header={
            isMusician ? (
              <FeedNewPostBlock
                user={user}
                avatarSrc={avatarSrc}
                text={feed.text}
                imageFile={feed.composerImage}
                audioFile={feed.composerAudio}
                isPublishing={feed.isPublishing}
                onTextChange={feed.setText}
                onImageChange={feed.setComposerImage}
                onAudioChange={feed.setComposerAudio}
                onSubmit={() => feed.createPost()}
              />
            ) : null
          }
        />
      </main>

      <aside className="feed-aside" aria-label="Фильтры">
        {isLabel ? <FeedLabelPanel posts={feed.posts} /> : null}
        <FeedFiltersPanel value={postTypeFilter} onChange={setPostTypeFilter} />
      </aside>
    </div>
  );
}
