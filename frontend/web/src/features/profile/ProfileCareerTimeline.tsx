import { useMemo } from "react";

import type { ApiPost, ApiUser } from "../../api";
import { formatProfileDate } from "../../lib/coverUrl";
import "./profile-career.css";

type CareerTimelineEntry = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  kind: "achievement" | "roadmap-post";
};

type ProfileCareerTimelineProps = {
  user: ApiUser;
  posts: ApiPost[];
};

export function ProfileCareerTimeline(props: ProfileCareerTimelineProps) {
  const entries = useMemo(
    () => buildCareerTimeline(props.user, props.posts),
    [props.user, props.posts],
  );

  if (entries.length === 0) {
    return (
      <section className="profile-career" aria-labelledby="profile-career-title">
        <h2 id="profile-career-title">Карьерный путь</h2>
        <p className="profile-career__empty">
          Здесь появятся достижения и этапы roadmap по мере прохождения пути.
        </p>
      </section>
    );
  }

  return (
    <section className="profile-career" aria-labelledby="profile-career-title">
      <h2 id="profile-career-title">Карьерный путь</h2>
      <ol className="profile-career__list">
        {entries.map((entry) => (
          <li className="profile-career__item" key={entry.id}>
            <div className="profile-career__marker" aria-hidden="true" />
            <div className="profile-career__content">
              <time dateTime={entry.date}>{formatProfileDate(entry.date)}</time>
              <strong>{entry.title}</strong>
              {entry.description ? <p>{entry.description}</p> : null}
              <span className={`profile-career__badge profile-career__badge--${entry.kind}`}>
                {entry.kind === "roadmap-post" ? "Roadmap" : "Достижение"}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function buildCareerTimeline(user: ApiUser, posts: ApiPost[]): CareerTimelineEntry[] {
  const achievementEntries: CareerTimelineEntry[] = user.achievements.map((achievement) => ({
    id: `achievement-${achievement.id}`,
    date: achievement.createdAt,
    title: achievement.title,
    description: achievement.description,
    kind: "achievement",
  }));

  const roadmapPostEntries: CareerTimelineEntry[] = posts
    .filter((post) => post.type === "roadmap")
    .map((post) => ({
      id: `post-${post.id}`,
      date: post.createdAt,
      title: post.text,
      description: null,
      kind: "roadmap-post" as const,
    }));

  return [...achievementEntries, ...roadmapPostEntries].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}
