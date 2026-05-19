import * as stylex from "@stylexjs/stylex";

type Props = {
  maxWidth?: string;
  children: React.ReactNode;
};

const styles = stylex.create({
  container: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    padding: "1.5rem",
  },
  inner: (maxWidth: string) => ({
    width: "100%",
    maxWidth,
    marginInline: "auto",
  }),
});

/**
 * FullWidth provides a single full-width content column.
 * Optionally constrain the max width for readability.
 */
export function FullWidth({ maxWidth = "100%", children }: Props) {
  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.inner(maxWidth))}>{children}</div>
    </div>
  );
}
