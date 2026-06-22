import type { ApiUser } from "../../api";
import { FeedPostCard } from "../feed/FeedPostCard";
import type { useFeedInteractions } from "../feed/useFeedInteractions";
import "../feed/feed.css";

type FeedState = ReturnType<typeof useFeedInteractions>;

type ProfilePostsSectionProps = {
  profileUser: ApiUser;
  currentUser: ApiUser;
  feed: FeedState;
};

export function ProfilePostsSection(props: ProfilePostsSectionProps) {
  const { feed } = props;

  return (
    <section className="profile-block profile-block--posts profile-section">
      <h2>Публикации</h2>
      {feed.error ? <p className="feed__error">{feed.error}</p> : null}
      {feed.posts.length ? (
        <div className="profile-posts-feed">
          {feed.posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUser={props.currentUser}
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
        </div>
      ) : (
        <p className="profile-post__empty">Публикаций пока нет</p>
      )}
    </section>
  );
}
