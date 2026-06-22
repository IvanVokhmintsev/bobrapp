import { useEffect, useMemo, useState } from "react";

import { api, type ApiUser, type RoadmapStep } from "../../api";
import actionLinkIcon from "../../assets/profile/action-link.svg";
import actionMessageIcon from "../../assets/profile/action-message.svg";
import actionShareIcon from "../../assets/profile/action-share.svg";
import albumCover from "../../assets/profile/album-cover.png";
import chevronDownIcon from "../../assets/profile/chevron-down.svg";
import concertPhoto from "../../assets/profile/concert-photo.png";
import concertStadiumIcon from "../../assets/profile/concert-stadium.svg";
import memberAvatarRing from "../../assets/profile/member-avatar-ring.svg";
import verifiedBadgeIcon from "../../assets/profile/verified-badge.svg";
import { useAuth } from "../../context/AuthContext";
import { ProfileEditSheet } from "./ProfileEditSheet";
import { AvatarPicker } from "./AvatarPicker";
import { ProfileRoadmapMap } from "./ProfileRoadmapMap";
import "./profile.css";

const demoAlbums = [
  { id: "1", title: "Любим древесину", date: "10 янв 2025", cover: albumCover },
  { id: "2", title: "Любим древесину", date: "10 янв 2025", cover: albumCover },
  { id: "3", title: "Любим древесину", date: "10 янв 2025", cover: albumCover },
  { id: "4", title: "Любим древесину", date: "10 янв 2025", cover: albumCover },
] as const;

const guideCards = [
  {
    title: "Как вырастить концерт с 100 до 1000 зрителей?",
    body: "Переход от локального выступления к крупному событию требует другой стратегии продвижения и мышления.",
    author: "И. Иванов",
  },
  {
    title: "Как собрать сильный каталог релизов?",
    body: "Планируйте релизы сериями, держите единый визуальный язык и регулярно возвращайтесь к аналитике.",
    author: "И. Иванов",
  },
];

export function ProfileScreen() {
  const { user: authUser, setUser } = useAuth();
  const [user, setLocalUser] = useState<ApiUser | null>(authUser);
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setLocalUser(authUser);
  }, [authUser]);

  useEffect(() => {
    void api
      .getProfile()
      .then((result) => {
        setLocalUser(result.user);
        setUser(result.user);
      })
      .catch(() => {
        /* keep cached user */
      });
  }, [setUser]);

  useEffect(() => {
    void api
      .getRoadmap()
      .then((result) => setRoadmapSteps(result.steps))
      .catch(() => setRoadmapSteps([]));
  }, []);

  const members = useMemo(() => (user ? buildMembers() : []), [user]);
  const tags = useMemo(() => (user ? buildTags(user) : []), [user]);

  if (!user) {
    return null;
  }

  const bio =
    user.musicianProfile?.bio?.trim() ||
    "Расскажите о себе в редактировании профиля. Здесь появится описание группы, проекта или артиста.";

  function handleProfileSaved(nextUser: ApiUser) {
    setLocalUser(nextUser);
    setUser(nextUser);
  }

  return (
    <>
      <div className="profile-page">
        <main className="profile-page__middle">
          {selectedLevel === null ? (
            <ProfileSummary
              user={user}
              members={members}
              tags={tags}
              bio={bio}
              onEdit={() => setEditOpen(true)}
              onAvatarUpdated={handleProfileSaved}
            />
          ) : (
            <ProfileRoadmapMap
              selectedLevel={selectedLevel}
              compact
              onSelectLevel={setSelectedLevel}
            />
          )}
        </main>

        <aside className="profile-page__right">
          {selectedLevel === null ? (
            <ProfileRoadmapMap onSelectLevel={setSelectedLevel} />
          ) : (
            <RoadmapDetail
              level={selectedLevel}
              steps={roadmapSteps}
              onBack={() => setSelectedLevel(null)}
            />
          )}
        </aside>
      </div>

      {editOpen ? (
        <ProfileEditSheet
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={handleProfileSaved}
        />
      ) : null}
    </>
  );
}

function ProfileSummary(props: {
  user: ApiUser;
  members: ProfileMember[];
  tags: ProfileTag[];
  bio: string;
  onEdit: () => void;
  onAvatarUpdated: (user: ApiUser) => void;
}) {
  return (
    <div className="profile-summary">
      <section className="profile-card">
        <header className="profile-card__hero">
          <AvatarPicker
            user={props.user}
            size="large"
            onUpdated={props.onAvatarUpdated}
          />
          <div className="profile-card__identity">
            <div className="profile-card__name-row">
              <h1>{props.user.name}</h1>
              <img className="profile-card__verified" src={verifiedBadgeIcon} alt="" />
              <button
                type="button"
                className="profile-card__chevron-btn"
                onClick={props.onEdit}
                aria-label="Редактировать профиль"
              >
                <img src={chevronDownIcon} alt="" />
              </button>
            </div>
            <div className="profile-card__actions">
              <button type="button" aria-label="Ссылка">
                <img src={actionLinkIcon} alt="" />
              </button>
              <button type="button" aria-label="Поделиться">
                <img src={actionShareIcon} alt="" />
              </button>
              <button type="button" aria-label="Сообщение">
                <img src={actionMessageIcon} alt="" />
              </button>
            </div>
          </div>
        </header>

        <section className="profile-members" aria-label="Состав">
          {props.members.map((member) => (
            <article key={member.id}>
              <img src={member.avatarUrl} alt="" />
              <span>{member.name}</span>
            </article>
          ))}
        </section>
      </section>

      <section className="profile-block">
        <h2>О нас</h2>
        <p>{props.bio}</p>
        <div className="profile-tags">
          {props.tags.map((tag) => (
            <span className={`profile-tag profile-tag--${tag.tone}`} key={tag.id}>
              {tag.label}
            </span>
          ))}
        </div>
      </section>

      <section className="profile-block profile-block--albums">
        <h2>Альбомы</h2>
        <div className="profile-albums">
          {demoAlbums.map((album) => (
            <article className="profile-album" key={album.id}>
              <img src={album.cover} alt="" />
              <strong>{album.title}</strong>
              <span>{album.date}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-block">
        <h2>Концерты</h2>
        <div className="profile-concerts">
          <article className="profile-concert profile-concert--dark">
            <img src={concertStadiumIcon} alt="" />
            <strong>СК “Олимпийский” 20.09</strong>
          </article>
          <article className="profile-concert profile-concert--photo">
            <img className="profile-concert__photo" src={concertPhoto} alt="" />
            <img className="profile-concert__icon" src={concertStadiumIcon} alt="" />
            <strong>СК “Олимпийский” 20.09</strong>
          </article>
        </div>
      </section>
    </div>
  );
}

function RoadmapDetail(props: {
  level: number;
  steps: RoadmapStep[];
  onBack: () => void;
}) {
  const milestones = buildMilestones(props.steps, props.level);

  return (
    <section className="profile-roadmap-detail">
      <button type="button" className="profile-roadmap-detail__back" onClick={props.onBack}>
        ‹ Уровень {props.level}
      </button>

      <div className="profile-roadmap-detail__list">
        {milestones.map((milestone) => (
          <article
            className={`profile-milestone ${milestone.completed ? "is-completed" : ""}`}
            key={milestone.id}
          >
            <span aria-hidden="true">⚙</span>
            <p>{milestone.title}</p>
          </article>
        ))}
      </div>

      <h2>Гайды и статьи по этапу:</h2>
      <div className="profile-guides">
        {guideCards.map((guide) => (
          <article className="profile-guide" key={guide.title}>
            <div>
              <h3>{guide.title}</h3>
              <p>{guide.body}</p>
              <span>{guide.author}</span>
            </div>
            <strong aria-hidden="true">›</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

type ProfileMember = {
  id: string;
  name: string;
  avatarUrl: string;
};

type ProfileTag = {
  id: string;
  label: string;
  tone: "green" | "blue";
};

function buildMembers(): ProfileMember[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `member-${index}`,
    name: "Иван Иванов",
    avatarUrl: memberAvatarRing,
  }));
}

function buildTags(user: ApiUser): ProfileTag[] {
  const source = [
    ...(user.musicianProfile?.genres ?? []),
    ...(user.musicianProfile?.instruments ?? []),
    ...user.achievements.map((achievement) => achievement.title),
  ].filter(Boolean);

  const labels =
    source.length > 0
      ? source.slice(0, 4)
      : ["Есть мониторы", "Кейтеринг", "Кейтеринг", "Кейтеринг"];

  return labels.map((label, index) => ({
    id: `${label}-${index}`,
    label,
    tone: index === 0 ? "green" : "blue",
  }));
}

function buildMilestones(steps: RoadmapStep[], level: number) {
  const fallback = [
    "Майлстоун «Сильный каталог»: Более трёх альбомов записано и релизнуто",
    "Майлстоун «Стабильные концерты»: Собран регулярный концертный график",
    "Майлстоун «Промо»: Оформлены материалы для продвижения релиза",
    "Майлстоун «Команда»: Распределены роли и зона ответственности",
    "Майлстоун «Аудитория»: Появился устойчивый канал коммуникации",
    "Майлстоун «Сцена»: Подготовлена программа для выступления",
    "Майлстоун «Аналитика»: Зафиксированы цели следующего этапа",
  ];

  if (steps.length === 0) {
    return fallback.map((title, index) => ({
      id: `${level}-${index}`,
      title,
      completed: index < 5,
    }));
  }

  return steps.slice(0, 7).map((step, index) => ({
    id: step.id,
    title: `Майлстоун «${step.title}»: ${step.description}`,
    completed: step.status === "completed" || index < Math.max(1, 9 - level),
  }));
}
