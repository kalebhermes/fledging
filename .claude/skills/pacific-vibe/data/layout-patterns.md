# Layout Patterns

Layout components for composing page structures. These are pure React + StyleX components shipped as templates in `templates/layouts/`. Copy them into your project's `src/components/layouts/` when needed.

## PageShell

**Required wrapper for chrome modes.** Provides SoFiHeader and Footer.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | required | Layout sections |
| chrome | boolean | `true` | Show SoFiHeader and Footer. Set to `false` for embedded views or kiosk demos |

```tsx
import { PageShell } from "./components/layouts/PageShell";

// With header and footer (default)
<PageShell>
  {/* Layout sections go here */}
</PageShell>

// Without header and footer
<PageShell chrome={false}>
  {/* Content only */}
</PageShell>
```

**Dependencies:** `@sofi-web-ui/sofi-header`, `@sofi-web-ui/footer`, `@sofi-web-ui/core` (Main)

---

## SidebarLeft

Left sidebar (fixed width) + main content area.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| sidebar | ReactNode | required | Content for the sidebar |
| sidebarWidth | string | "240px" | Width of the sidebar |
| children | ReactNode | required | Main content area |

```tsx
<PageShell>
  <SidebarLeft sidebar={<NavMenu />}>
    <Dashboard />
  </SidebarLeft>
</PageShell>
```

**Best for:** Settings pages, admin panels, documentation, navigation-heavy pages.

---

## SidebarRight

Main content area + right sidebar (fixed width).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| sidebar | ReactNode | required | Content for the sidebar |
| sidebarWidth | string | "320px" | Width of the sidebar |
| children | ReactNode | required | Main content area |

```tsx
<PageShell>
  <SidebarRight sidebar={<ActivityFeed />}>
    <MainContent />
  </SidebarRight>
</PageShell>
```

**Best for:** Detail pages with supplementary info, feeds with filters, pages with contextual help.

---

## FullWidth

Single full-width content column with optional max-width constraint.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| maxWidth | string | "100%" | Maximum width of the content |
| children | ReactNode | required | Page content |

```tsx
<PageShell>
  <FullWidth maxWidth="960px">
    <ArticleContent />
  </FullWidth>
</PageShell>
```

**Best for:** Landing pages, article/content pages, simple forms, onboarding flows.

---

## TwoColumn

Equal two-column split layout.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| left | ReactNode | required | Left column content |
| right | ReactNode | required | Right column content |
| gap | string | "1.5rem" | Gap between columns |

```tsx
<PageShell>
  <TwoColumn
    left={<ComparisonA />}
    right={<ComparisonB />}
  />
</PageShell>
```

**Best for:** Comparison views, split forms, side-by-side editors, before/after views.

---

## HeroContent

Hero/banner section above main content area.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| hero | ReactNode | required | Hero/banner content |
| children | ReactNode | required | Main content below hero |

```tsx
<PageShell>
  <HeroContent hero={<WelcomeBanner />}>
    <DashboardCards />
  </HeroContent>
</PageShell>
```

**Best for:** Dashboards, marketing pages, welcome/onboarding screens, profile pages.

---

## Composing Layouts

Layout sections can be nested and combined:

```tsx
<PageShell>
  <HeroContent hero={<PageBanner title="Dashboard" />}>
    <SidebarLeft sidebar={<DashboardNav />}>
      <TwoColumn
        left={<MetricsPanel />}
        right={<ActivityPanel />}
      />
    </SidebarLeft>
  </HeroContent>
</PageShell>
```

## Copying Layouts Into Your Project

Layout files are in `templates/layouts/`. Copy only the ones you need:

```bash
# Copy specific layouts
mkdir -p src/components/layouts
cp <skill-dir>/templates/layouts/PageShell.tsx src/components/layouts/
cp <skill-dir>/templates/layouts/SidebarLeft.tsx src/components/layouts/

# Create a barrel export for what you copied
echo 'export { PageShell } from "./PageShell";
export { SidebarLeft } from "./SidebarLeft";' > src/components/layouts/index.ts
```

The `--chrome=full` scaffold mode automatically copies PageShell and FullWidth. For other layouts, copy them as needed during development.
