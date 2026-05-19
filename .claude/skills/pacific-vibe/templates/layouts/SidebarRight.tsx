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
  content: {
    flex: 1,
    minWidth: 0,
  },
  sidebar: (width: string) => ({
    flexShrink: 0,
    width,
  }),
});

/**
 * SidebarRight provides main content alongside a right sidebar.
 * The content area fills available space and the sidebar has a fixed width.
 */
export function SidebarRight({
  sidebar,
  sidebarWidth = "320px",
  children,
}: Props) {
  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.content)}>{children}</div>
      <aside {...stylex.props(styles.sidebar(sidebarWidth))}>{sidebar}</aside>
    </div>
  );
}
