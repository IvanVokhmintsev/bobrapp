import type { PostType } from "../../api";
import { ProPanel } from "../layout/ProPanel";

export type FeedPostTypeFilter = "all" | PostType;

const filterOptions: Array<{ value: FeedPostTypeFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "professional", label: "Публикации" },
  { value: "roadmap", label: "Roadmap" },
];

type FeedFiltersPanelProps = {
  value: FeedPostTypeFilter;
  onChange: (value: FeedPostTypeFilter) => void;
};

export function FeedFiltersPanel(props: FeedFiltersPanelProps) {
  return (
    <section className="feed-filters" aria-label="Фильтры ленты">
      <h2>Фильтры</h2>
      <div className="feed-filters__types" role="group" aria-label="Тип публикации">
        <span className="feed-filters__types-label">Тип публикации</span>
        <div className="feed-filters__types-list">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={props.value === option.value ? "is-active" : undefined}
              aria-pressed={props.value === option.value}
              onClick={() => props.onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <ProPanel />
    </section>
  );
}
