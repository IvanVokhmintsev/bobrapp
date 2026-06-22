import { useAuth } from "../../context/AuthContext";
import defaultAvatar from "../../assets/feed/card-cover.png";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { ProPanel } from "../layout/ProPanel";
import { FeedNewPostBlock } from "./FeedNewPostBlock";
import { FeedPostCard } from "./FeedPostCard";
import "./feed.css";
import { useFeedInteractions } from "./useFeedInteractions";

export function FeedScreen() {
  const { user } = useAuth();
  const feed = useFeedInteractions();

  if (!user) {
    return null;
  }

  const avatarSrc = resolveAvatarUrl(user.musicianProfile?.avatarUrl, defaultAvatar);
  const isMusician = user.role === "musician";

  return (
    <div className="feed-page">
      <main className="feed__main">
        {feed.error ? <p className="feed__error">{feed.error}</p> : null}

        <section className="feed__stream" aria-label="Лента постов">
          {isMusician ? (
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
          ) : null}

          {feed.posts.length === 0 ? (
            <p className="feed__empty">В ленте пока нет постов. Будьте первым!</p>
          ) : null}
          {feed.posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUser={user}
              commentsOpen={feed.expandedCommentPostIds.has(post.id)}
              commentsLoading={feed.loadingCommentPostIds.has(post.id)}
              comments={feed.commentsByPost[post.id]}
              commentText={feed.commentTextByPost[post.id] ?? ""}
              onLike={() => void feed.likePost(post.id)}
              onFavorite={() => void feed.favoritePost(post.id)}
              onDeletePost={() => void feed.deletePost(post.id)}
              onToggleComments={() => void feed.toggleComments(post.id)}
              onCommentTextChange={(value) => feed.setCommentText(post.id, value)}
              onCreateComment={() => void feed.createComment(post.id)}
              onDeleteComment={(commentId) => void feed.deleteComment(post, commentId)}
            />
          ))}
        </section>
      </main>

      <aside className="feed-aside" aria-label="Фильтры">
        <FiltersPanel />
      </aside>
    </div>
  );
}

function FiltersPanel() {
  return (
    <section className="feed-filters">
      <h2>Фильтры</h2>
      <div className="feed-filters__range">
        <span>Уровень</span>
        <div className="feed-filters__line">
          <b>7</b>
          <b>8</b>
        </div>
      </div>
      <div className="feed-filters__years">
        <span>Создание с</span>
        <button type="button">2023</button>
        <span>до</span>
        <button type="button">2024</button>
      </div>
      <div className="feed-filters__values">
        <span>Ценности</span>
        <div>
          <em className="tone-green">Инновации в звуке</em>
          <em className="tone-purple">Очень любим бобров</em>
          <em className="tone-orange">Финалисты Голос</em>
          <button type="button" aria-label="Добавить фильтр">
            +
          </button>
        </div>
      </div>
      <ProPanel />
      <button type="button" className="feed-filters__apply">
        Применить
      </button>
    </section>
  );
}
