import type { ApiUser } from "../../api";
import { FeedComposer, FeedProBanner, FeedTabBar, FeedTopBar } from "./FeedChrome";
import { FeedPostCard } from "./FeedPostCard";
import "./feed.css";
import { useFeedInteractions } from "./useFeedInteractions";

type FeedScreenProps = {
  token: string;
  user: ApiUser;
  onSelectTab?: (tab: "feed" | "booking" | "events" | "profile") => void;
};

export function FeedScreen(props: FeedScreenProps) {
  const feed = useFeedInteractions(props.token);

  return (
    <div className="feed">
      <main className="feed__main">
        <FeedTopBar />

        {props.user.role === "musician" ? (
          <FeedComposer
            text={feed.text}
            type={feed.type}
            onTextChange={feed.setText}
            onTypeChange={feed.setType}
            onSubmit={() => void feed.createPost()}
          />
        ) : null}

        {feed.error ? <p className="feed__error">{feed.error}</p> : null}

        <section className="feed__stream" aria-label="Лента постов">
          {feed.posts.length === 0 ? (
            <p className="feed__empty">В ленте пока нет постов. Будьте первым!</p>
          ) : null}
          {feed.posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUser={props.user}
              commentsOpen={feed.expandedCommentPostIds.has(post.id)}
              commentsLoading={feed.loadingCommentPostIds.has(post.id)}
              comments={feed.commentsByPost[post.id]}
              commentText={feed.commentTextByPost[post.id] ?? ""}
              onLike={() => void feed.likePost(post.id)}
              onDeletePost={() => void feed.deletePost(post.id)}
              onToggleComments={() => void feed.toggleComments(post.id)}
              onCommentTextChange={(value) => feed.setCommentText(post.id, value)}
              onCreateComment={() => void feed.createComment(post.id)}
              onDeleteComment={(commentId) => void feed.deleteComment(post, commentId)}
            />
          ))}
        </section>

        <FeedProBanner />
      </main>

      <FeedTabBar onSelect={props.onSelectTab} />
    </div>
  );
}
