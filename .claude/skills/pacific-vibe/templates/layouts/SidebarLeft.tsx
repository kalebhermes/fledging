import * as stylex from "@stylexjs/stylex";

type Props = {
  sidebar: React.ReactNode;
  sidebarWidth?: string;
  children: React.ReactNode;
};

const styles = stylex.create({
  container: {
    display: "flex",
    flex: 1,
    gap: "1.5rem",
    padding: "1.5rem",
  },
  sidebar: (width: string) => ({
    flexShrink: 0,
    width,
  }),
  content: {
    flex: 1,
    minWidth: 0,
  },
});

/**
 * SidebarLeft provides a left sidebar alongside main content.
 * The sidebar has a fixed width and the content area fills remaining space.
 */
export function SidebarLeft({
  sidebar,
  sidebarWidth = "240px",
  children,
}: Props) {
  return (
    <div {...stylex.props(styles.container)}>
      <aside {...stylex.props(styles.sidebar(sidebarWidth))}>{sidebar}</aside>
      <div {...stylex.props(styles.content)}>{children}</div>
    </div>
  );
}
