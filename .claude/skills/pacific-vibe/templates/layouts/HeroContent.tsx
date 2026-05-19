import * as stylex from "@stylexjs/stylex";

type Props = {
  hero: React.ReactNode;
  children: React.ReactNode;
};

const styles = stylex.create({
  container: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  hero: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: "1.5rem",
  },
});

/**
 * HeroContent provides a hero/banner section above the main content area.
 * The hero spans the full width and the content area fills remaining space.
 */
export function HeroContent({ hero, children }: Props) {
  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.hero)}>{hero}</div>
      <div {...stylex.props(styles.content)}>{children}</div>
    </div>
  );
}
