import * as stylex from "@stylexjs/stylex";

type Props = {
  left: React.ReactNode;
  right: React.ReactNode;
  gap?: string;
};

const styles = stylex.create({
  container: {
    display: "flex",
    flex: 1,
    padding: "1.5rem",
  },
  containerWithGap: (gap: string) => ({
    gap,
  }),
  column: {
    flex: 1,
    minWidth: 0,
  },
});

/**
 * TwoColumn provides an equal two-column split layout.
 * Both columns share the available space equally.
 */
export function TwoColumn({ left, right, gap = "1.5rem" }: Props) {
  return (
    <div
      {...stylex.props(styles.container, styles.containerWithGap(gap))}
    >
      <div {...stylex.props(styles.column)}>{left}</div>
      <div {...stylex.props(styles.column)}>{right}</div>
    </div>
  );
}
