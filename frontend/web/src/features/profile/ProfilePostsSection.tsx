import type { ApiUser } from "../../api";
import { FeedPostStream } from "../feed/FeedPostStream";
import type { useFeedInteractions } from "../feed/useFeedInteractions";
import "../feed/feed.css";

type FeedState = ReturnType<typeof useFeedInteractions>;

type ProfilePostsSectionProps = {
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
        <FeedPostStream
          feed={feed}
          currentUser={props.currentUser}
          className="profile-posts-feed"
          ariaLabel="Публикации профиля"
        />
      ) : (
        <p className="profile-post__empty">Публикаций пока нет</p>
      )}
    </section>
  );
}
