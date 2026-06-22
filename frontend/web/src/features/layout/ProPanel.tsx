type ProPanelProps = {
  compact?: boolean;
};

export function ProPanel(props: ProPanelProps) {
  return (
    <section className={props.compact ? "app-pro app-pro--compact" : "app-pro"}>
      <p>
        Оформите подписку Pro, чтобы повысить видимость ваших постов и
        разблокировать дополнительный функционал
      </p>
      <strong>попробовать от 199₽{props.compact ? "" : "/мес"} ›</strong>
    </section>
  );
}
