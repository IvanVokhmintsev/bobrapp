import type { ReactNode } from "react";

import type { ApiUser } from "../../api";
import { FeedPostCard } from "./FeedPostCard";
import type { useFeedInteractions } from "./useFeedInteractions";

type FeedState = ReturnType<typeof useFeedInteractions>;

type FeedPostStreamProps = {
  feed: FeedState;
  currentUser: ApiUser;
  className?: string;
  ariaLabel: string;
  emptyMessage?: string;
  showEmpty?: boolean;
  showLoadMore?: boolean;
  header?: ReactNode;
};

export function FeedPostStream(props: FeedPostStreamProps) {
  const streamClassName = ["feed-surface", "feed__stream", props.className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={streamClassName} aria-label={props.ariaLabel}>
      {props.header}
      {props.showEmpty && props.emptyMessage && props.feed.posts.length === 0 ? (
        <p className="feed__empty">{props.emptyMessage}</p>
      ) : null}
      {props.feed.posts.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
          currentUser={props.currentUser}
          commentsOpen={props.feed.expandedCommentPostIds.has(post.id)}
          commentsLoading={props.feed.loadingCommentPostIds.has(post.id)}
          comments={props.feed.commentsByPost[post.id]}
          commentText={props.feed.commentTextByPost[post.id] ?? ""}
          onLike={() => void props.feed.likePost(post.id)}
          onFavorite={() => void props.feed.favoritePost(post.id)}
          onSavePost={
            post.author.id === props.currentUser.id
              ? async (text) => {
                  await props.feed.updatePost(post.id, text);
                }
              : undefined
          }
          onDeletePost={
            post.author.id === props.currentUser.id
              ? () => void props.feed.deletePost(post.id)
              : undefined
          }
          onToggleComments={() => void props.feed.toggleComments(post.id)}
          onCommentTextChange={(value) => props.feed.setCommentText(post.id, value)}
          onCreateComment={() => void props.feed.createComment(post.id)}
          onDeleteComment={(commentId) => void props.feed.deleteComment(post, commentId)}
        />
      ))}
      {props.showLoadMore && props.feed.pageInfo.hasNextPage ? (
        <button
          type="button"
          className="feed__load-more"
          disabled={props.feed.isLoadingMore}
          onClick={() => void props.feed.loadMorePosts()}
        >
          {props.feed.isLoadingMore ? "Загрузка…" : "Показать ещё"}
        </button>
      ) : null}
    </section>
  );
}
