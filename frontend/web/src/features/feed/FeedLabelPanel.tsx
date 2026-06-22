import { useMemo } from "react";
import { Link } from "react-router-dom";

import type { ApiPost } from "../../api";
import "./feed-label.css";

type FeedLabelPanelProps = {
  posts: ApiPost[];
};

export function FeedLabelPanel(props: FeedLabelPanelProps) {
  const stats = useMemo(() => buildFeedStats(props.posts), [props.posts]);

  return (
    <section className="feed-label-panel" aria-label="Анализ активности ленты">
      <div className="feed-label-panel__head">
        <h2>Обзор активности</h2>
        <p>Лента без публикации — оценивайте артистов по их действиям и сохраняйте интересное.</p>
      </div>
      <div className="feed-label-panel__stats">
        <article>
          <strong>{stats.total}</strong>
          <span>событий в ленте</span>
        </article>
        <article>
          <strong>{stats.professional}</strong>
          <span>публикаций</span>
        </article>
        <article>
          <strong>{stats.roadmap}</strong>
          <span>этапов roadmap</span>
        </article>
      </div>
      <p className={`feed-label-panel__activity feed-label-panel__activity--${stats.activityLevel}`}>
        {stats.activityMessage}
      </p>
      <div className="feed-label-panel__links">
        <Link to="/people">Каталог музыкантов</Link>
        <Link to="/favorites">Избранное</Link>
      </div>
    </section>
  );
}

function buildFeedStats(posts: ApiPost[]) {
  const professional = posts.filter((post) => post.type === "professional").length;
  const roadmap = posts.filter((post) => post.type === "roadmap").length;
  const latestPost = posts[0];
  const latestDate = latestPost ? new Date(latestPost.createdAt) : null;
  const daysSinceLatest =
    latestDate === null
      ? null
      : Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24));

  let activityLevel: "empty" | "stale" | "active" = "empty";
  let activityMessage = "В ленте пока нет активности — подпишитесь на музыкантов или добавьте их в избранное.";

  if (posts.length > 0) {
    if (daysSinceLatest !== null && daysSinceLatest > 30) {
      activityLevel = "stale";
      activityMessage = `Последняя активность ${daysSinceLatest} дн. назад — у части артистов низкая текущая динамика.`;
    } else {
      activityLevel = "active";
      activityMessage = "Есть свежая активность — смотрите типы публикаций и переходите в профили авторов.";
    }
  }

  return {
    total: posts.length,
    professional,
    roadmap,
    activityLevel,
    activityMessage,
  };
}
