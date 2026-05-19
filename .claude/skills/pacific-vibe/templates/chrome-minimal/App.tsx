import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { darkMode } from '@sofi-web-ui/base';
import { colorTokens } from '@sofi-web-ui/base/dist/colorTokens.stylex';
import { globalTokens } from '@sofi-web-ui/base/dist/globalTokens.stylex';
import { Typography, Header, Logo, ProductName, MenuRight } from '@sofi-web-ui/core';
import { Icon, Night } from '@sofi-web-ui/icons';

// --- Dark mode toggle ---
function DarkModeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      onClick={onToggle}
      {...stylex.props(toggleStyles.track, isDark && toggleStyles.trackOn)}
    >
      <span {...stylex.props(toggleStyles.knob, isDark && toggleStyles.knobOn)}>
        <Icon icon={Night} size={14} iconColor={isDark ? 'contentPrimaryDefault' : 'contentSecondaryDefault'} />
      </span>
    </button>
  );
}

const toggleStyles = stylex.create({
  track: {
    width: '48px',
    height: '28px',
    borderRadius: '14px',
    backgroundColor: colorTokens.surfaceSwitchUnselected,
    borderWidth: 0,
    cursor: 'pointer',
    position: 'relative',
    transitionProperty: 'background-color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    padding: 0,
  },
  trackOn: {
    backgroundColor: colorTokens.surfaceElevatedSelected,
  },
  knob: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: colorTokens.surfaceElevatedDefault,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'left',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },
  knobOn: {
    left: '22px',
  },
});

// --- App ---

export function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div {...stylex.props([isDark && darkMode, styles.page])}>
      <Header>
        <Logo label="Home" />
        <ProductName>Dashboard</ProductName>
        <MenuRight>
          <DarkModeToggle isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
        </MenuRight>
      </Header>
      <main {...stylex.props(styles.main)}>
        <div {...stylex.props(styles.card)}>
          <Typography as="p" styleOf="bodyLarge">
            Replace this with your Pacific components.
          </Typography>
        </div>
      </main>
      <footer {...stylex.props(styles.footer)}>
        <Typography as="p" styleOf="bodySmall" textColor="contentSecondaryDefault">
          &copy; {new Date().getFullYear()} Social Finance, Inc. All rights reserved.
        </Typography>
      </footer>
    </div>
  );
}

const styles = stylex.create({
  page: {
    backgroundColor: colorTokens.surfaceBase,
    color: colorTokens.contentPrimaryDefault,
    minHeight: '100vh',
    fontFamily: globalTokens.primaryText,
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    flex: 1,
    paddingTop: globalTokens.rpx32,
    paddingBottom: globalTokens.rpx32,
    paddingLeft: globalTokens.rpx32,
    paddingRight: globalTokens.rpx32,
    maxWidth: '70rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  },
  card: {
    backgroundColor: colorTokens.surfaceSecondaryDefault,
    borderRadius: globalTokens.borderRadius16,
    paddingTop: globalTokens.rpx24,
    paddingBottom: globalTokens.rpx24,
    paddingLeft: globalTokens.rpx24,
    paddingRight: globalTokens.rpx24,
  },
  footer: {
    paddingTop: globalTokens.rpx16,
    paddingBottom: globalTokens.rpx16,
    paddingLeft: globalTokens.rpx32,
    paddingRight: globalTokens.rpx32,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colorTokens.strokeEdge,
    textAlign: 'center',
  },
});
