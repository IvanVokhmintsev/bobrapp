type PlaceholderScreenProps = {
  title: string;
  description: string;
};

export function PlaceholderScreen(props: PlaceholderScreenProps) {
  return (
    <main className="app-page app-page--placeholder">
      <h1>{props.title}</h1>
      <p className="app-page__intro">{props.description}</p>
      <section className="app-page__panel app-page__panel--placeholder">
        <p>Раздел в разработке</p>
      </section>
    </main>
  );
}
