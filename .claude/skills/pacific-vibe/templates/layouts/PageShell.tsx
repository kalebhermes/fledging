import * as stylex from "@stylexjs/stylex";
import { SoFiHeader } from "@sofi-web-ui/sofi-header";
import { Footer, LegalLinks, CopyRight } from "@sofi-web-ui/footer";
import { Main } from "@sofi-web-ui/core";

type Props = {
  children: React.ReactNode;
  chrome?: boolean;
};

const LEGAL_LINKS = [
  { name: "Privacy Policy", link: "#privacy", id: "privacy" },
  { name: "Terms of Service", link: "#terms", id: "terms" },
  { name: "Licenses", link: "#licenses", id: "licenses" },
];

const styles = stylex.create({
  shell: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
});

export function PageShell({ children, chrome = true }: Props) {
  return (
    <div {...stylex.props(styles.shell)}>
      {chrome && <SoFiHeader />}
      <Main>
        <div {...stylex.props(styles.main)}>{children}</div>
      </Main>
      {chrome && (
        <Footer>
          <LegalLinks legalLinks={LEGAL_LINKS} />
          <CopyRight />
        </Footer>
      )}
    </div>
  );
}
