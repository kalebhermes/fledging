#!/usr/bin/env node

/**
 * index-repo.mjs — Component + Token Indexer for sofi-web-ui
 *
 * BUILD-TIME SCRIPT — run by skill maintainers to regenerate data/.
 * Parses the sofi-web-ui repo to extract component APIs (via ts-morph)
 * and design tokens (via file parsing). Outputs to data/ in the skill directory.
 *
 * Usage: node index-repo.mjs [--force] [--repo-path=<path>]
 */

import { Project, SyntaxKind } from 'ts-morph';
import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const COMPONENTS_PATH = path.join(DATA_DIR, 'components.json');
const TOKENS_PATH = path.join(DATA_DIR, 'tokens.json');
const ICONS_PATH = path.join(DATA_DIR, 'icons.json');
const VERSION_PATH = path.join(DATA_DIR, 'version.json');
const OVERRIDES_PATH = path.join(DATA_DIR, 'component-overrides.json');

const PACKAGES_TO_INDEX = ['core', 'form-inputs'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    repoPath: args.find(a => a.startsWith('--repo-path='))?.split('=')[1],
  };
}

function findRepo(hint) {
  // 1. CLI argument
  if (hint && fs.existsSync(path.join(hint, 'packages'))) return hint;

  // 2. Common local paths
  const candidates = [
    path.join(process.env.HOME, 'codez', 'sofi-web-ui'),
    path.join(process.env.HOME, 'codez', 'sofi-web-ui-stable'),
    path.join(process.env.HOME, 'code', 'sofi-web-ui'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'packages'))) return c;
  }

  // 3. Shallow clone fallback (uses GITLAB_TOKEN for auth)
  const cacheDir = path.join(process.env.HOME, '.cache', 'sofi-pacific', 'repo');
  if (fs.existsSync(path.join(cacheDir, 'packages'))) return cacheDir;

  const token = process.env.GITLAB_TOKEN;
  if (!token) {
    throw new Error(
      'Cannot find sofi-web-ui locally and GITLAB_TOKEN is not set.\n' +
      'Either clone the repo to ~/codez/sofi-web-ui, pass --repo-path=<path>, or set GITLAB_TOKEN.'
    );
  }

  process.stderr.write('Cloning sofi-web-ui (shallow, via GITLAB_TOKEN)...\n');
  fs.mkdirSync(cacheDir, { recursive: true });
  try {
    execSync(
      `git clone --depth 1 https://oauth2:${token}@gitlab.com/sofiinc/webcore/sofi-web-ui.git "${cacheDir}"`,
      { stdio: 'pipe' }
    );
    return cacheDir;
  } catch (err) {
    throw new Error(
      `Failed to clone sofi-web-ui. Check that GITLAB_TOKEN has repository read access.\n${err.message}`
    );
  }
}

// ---------------------------------------------------------------------------
// Component Parser (ts-morph)
// ---------------------------------------------------------------------------

function parseComponents(repoPath) {
  const components = [];

  for (const pkgName of PACKAGES_TO_INDEX) {
    const pkgDir = path.join(repoPath, 'packages', pkgName);
    const srcDir = path.join(pkgDir, 'src');
    if (!fs.existsSync(srcDir)) continue;

    // Read package.json for the npm package name
    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8')
    );
    const npmPkg = pkgJson.name; // e.g. @sofi-web-ui/core

    // Find all .tsx files (skip tests, stories, styles)
    const files = glob.sync('**/*.tsx', {
      cwd: srcDir,
      ignore: ['**/__tests__/**', '**/__stories__/**', '**/index.tsx'],
    });

    // Create ts-morph project with minimal resolution
    const project = new Project({
      compilerOptions: { jsx: 4 /* JsxEmit.ReactJSX */ },
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
    });

    // Pre-compute which directories have __figma__/ subdirectories
    const figmaGroups = new Map(); // relDir -> dirName (e.g. "Buttons" -> "Buttons")
    for (const file of files) {
      const dir = path.dirname(file); // e.g. "Buttons" or "Buttons/subdir"
      if (figmaGroups.has(dir)) continue;
      const topDir = dir.split(path.sep)[0]; // first path segment
      const figmaDir = path.join(srcDir, topDir, '__figma__');
      if (fs.existsSync(figmaDir)) {
        figmaGroups.set(dir, topDir);
      }
    }

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const dir = path.dirname(file);
      const figmaGroup = figmaGroups.get(dir) || null;
      try {
        const sourceFile = project.addSourceFileAtPath(filePath);
        const parsed = parseSourceFile(sourceFile, npmPkg, file, figmaGroup);
        components.push(...parsed);
        project.removeSourceFile(sourceFile);
      } catch (err) {
        process.stderr.write(`  Warning: failed to parse ${file}: ${err.message}\n`);
      }
    }
  }

  // Resolution pass: components that reference a *Props type from another file
  // (e.g., ContainedButton referencing ButtonProps) need their props filled in.
  //
  // First, collect props from entries that already have them parsed.
  const propsByInterface = new Map();
  for (const comp of components) {
    if (comp.propsInterface && comp.props.length > 0) {
      propsByInterface.set(comp.propsInterface, comp.props);
    }
  }

  // Check if any orphan components still have unresolved props. If so, scan
  // .ts type-definition files (e.g., buttonTypes.ts, linkTypes.ts) that were
  // not included in the .tsx glob but export *Props interfaces.
  const unresolvedRefs = new Set();
  for (const comp of components) {
    if (comp._propsRef && comp.props.length === 0 && !propsByInterface.has(comp._propsRef)) {
      unresolvedRefs.add(comp._propsRef);
    }
  }

  if (unresolvedRefs.size > 0) {
    for (const pkgName of PACKAGES_TO_INDEX) {
      const srcDir = path.join(repoPath, 'packages', pkgName, 'src');
      if (!fs.existsSync(srcDir)) continue;

      // Find .ts type-definition files (not .tsx, not index.ts, not styles)
      const tsFiles = glob.sync('**/*{T,t}ypes.ts', {
        cwd: srcDir,
        ignore: ['**/__tests__/**', '**/__stories__/**', '**/index.ts'],
      });

      const project = new Project({
        compilerOptions: { jsx: 4 },
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
      });

      for (const file of tsFiles) {
        const filePath = path.join(srcDir, file);
        try {
          const sourceFile = project.addSourceFileAtPath(filePath);
          const propsDecls = [
            ...sourceFile.getTypeAliases().filter(t => t.isExported() && t.getName().endsWith('Props')),
            ...sourceFile.getInterfaces().filter(i => i.isExported() && i.getName().endsWith('Props')),
          ];
          for (const decl of propsDecls) {
            const propsName = decl.getName();
            if (unresolvedRefs.has(propsName) && !propsByInterface.has(propsName)) {
              propsByInterface.set(propsName, extractProps(decl));
            }
          }
          project.removeSourceFile(sourceFile);
        } catch { /* skip unparseable files */ }
      }
    }
  }

  for (const comp of components) {
    if (comp._propsRef && comp.props.length === 0) {
      const inherited = propsByInterface.get(comp._propsRef);
      if (inherited) {
        comp.props = inherited;
        comp.propsInterface = comp._propsRef;
      }
    }
    delete comp._propsRef;
  }

  return components;
}

function parseSourceFile(sourceFile, npmPkg, relPath, figmaGroup) {
  const results = [];

  // Track component names derived from Props declarations
  const propsComponentNames = new Set();

  // Find all exported type aliases and interfaces ending with "Props"
  const propsDecls = [
    ...sourceFile.getTypeAliases().filter(t => t.isExported() && t.getName().endsWith('Props')),
    ...sourceFile.getInterfaces().filter(i => i.isExported() && i.getName().endsWith('Props')),
  ];

  for (const decl of propsDecls) {
    const propsName = decl.getName();
    // Derive component name: "BannerProps" -> "Banner", "TextInputProps" -> "TextInput"
    const componentName = propsName.replace(/Props$/, '');
    propsComponentNames.add(componentName);

    // Skip internal/helper props (e.g. StandardButtonProps without a matching component)
    // We'll still include them if they look like a real component
    const props = extractProps(decl);

    // Get component-level JSDoc — check Props decl first, then component function/variable
    let componentJsDoc = getJsDoc(decl);

    // Check if there's a matching exported component and grab its JSDoc
    const matchingFn = sourceFile.getFunctions().find(
      f => f.isExported() && f.getName() === componentName
    );
    const matchingVar = sourceFile.getVariableDeclarations().find(
      v => v.isExported() && v.getName() === componentName
    );
    const aliasedVar = sourceFile.getVariableDeclarations().find(
      v => v.isExported() && v.getName().includes(componentName)
    );

    const hasComponent = !!(matchingFn || matchingVar);
    const hasAliasedExport = !!aliasedVar;

    // Fall back to component function/variable JSDoc if Props decl has none
    if (!componentJsDoc) {
      if (matchingFn) componentJsDoc = getJsDoc(matchingFn);
      if (!componentJsDoc && matchingVar) {
        componentJsDoc = getJsDoc(matchingVar.getVariableStatement?.() || matchingVar);
      }
      if (!componentJsDoc && aliasedVar) {
        componentJsDoc = getJsDoc(aliasedVar.getVariableStatement?.() || aliasedVar);
      }
    }

    results.push({
      name: componentName,
      package: npmPkg,
      importPath: npmPkg,
      propsInterface: propsName,
      description: componentJsDoc,
      hasMatchingExport: hasComponent || hasAliasedExport,
      sourceFile: relPath,
      figmaGroup: figmaGroup || null,
      props,
    });
  }

  // Second pass: find exported PascalCase components that don't have a local
  // *Props declaration. These are components that share a Props type defined
  // elsewhere (e.g., ContainedButton using ButtonProps from buttonTypes.ts).
  //
  // Also check for non-exported Props declarations in the same file (e.g.,
  // `interface TooltipProps extends PopoverProps<'div'> { ... }` without export).
  const localNonExportedProps = new Map();
  for (const decl of [
    ...sourceFile.getTypeAliases().filter(t => !t.isExported() && t.getName().endsWith('Props')),
    ...sourceFile.getInterfaces().filter(i => !i.isExported() && i.getName().endsWith('Props')),
  ]) {
    localNonExportedProps.set(decl.getName(), decl);
  }

  const orphanComponents = findOrphanComponents(sourceFile, propsComponentNames);
  for (const { name, propsRef, jsDoc } of orphanComponents) {
    // Try to resolve props from a non-exported local declaration first
    let props = [];
    const localDecl = localNonExportedProps.get(propsRef);
    if (localDecl) {
      props = extractProps(localDecl);
    }

    results.push({
      name,
      package: npmPkg,
      importPath: npmPkg,
      propsInterface: propsRef,
      description: jsDoc,
      hasMatchingExport: true,
      sourceFile: relPath,
      figmaGroup: figmaGroup || null,
      props,
      ...(!props.length && propsRef ? { _propsRef: propsRef } : {}),
    });
  }

  return results;
}

/**
 * Find exported PascalCase components in a source file that don't have a
 * matching *Props declaration in the same file. For each, try to determine
 * which Props type they reference (from imports or type annotations).
 */
function findOrphanComponents(sourceFile, propsComponentNames) {
  const orphans = [];

  // Collect exported PascalCase variable declarations
  for (const varDecl of sourceFile.getVariableDeclarations()) {
    if (!varDecl.isExported()) continue;
    const name = varDecl.getName();
    if (!/^[A-Z]/.test(name)) continue;
    if (propsComponentNames.has(name)) continue;

    const propsRef = extractPropsRef(varDecl);
    if (!propsRef) continue; // can't determine props type, skip

    const stmt = varDecl.getVariableStatement?.();
    const jsDoc = getJsDoc(stmt || varDecl);
    orphans.push({ name, propsRef, jsDoc });
  }

  // Collect exported PascalCase function declarations
  for (const fnDecl of sourceFile.getFunctions()) {
    if (!fnDecl.isExported()) continue;
    const name = fnDecl.getName();
    if (!name || !/^[A-Z]/.test(name)) continue;
    if (propsComponentNames.has(name)) continue;

    const propsRef = extractPropsRefFromFunction(fnDecl);
    if (!propsRef) continue;

    const jsDoc = getJsDoc(fnDecl);
    orphans.push({ name, propsRef, jsDoc });
  }

  return orphans;
}

/**
 * Try to extract the *Props type name from a variable declaration.
 * Handles common React patterns:
 *   - Type annotation: `const X: React.FC<ButtonProps> = ...`
 *   - forwardRef: `const X = React.forwardRef<HTMLElement, ButtonProps>(...)`
 *   - Initializer with generic: `const X = memo<ButtonProps>(...)`
 */
function extractPropsRef(varDecl) {
  // 1. Check explicit type annotation
  const typeNode = varDecl.getTypeNode?.();
  if (typeNode) {
    const match = typeNode.getText().match(/(\w+Props)\b/);
    if (match) return match[1];
  }

  // 2. Check initializer expression for forwardRef/memo type arguments
  const init = varDecl.getInitializer?.();
  if (!init) return null;

  const initText = init.getText();

  // forwardRef<HTMLElement, ButtonProps>(...) — second type arg is the Props
  const forwardRefMatch = initText.match(/forwardRef\s*<[^,>]+,\s*(\w+Props)\b/);
  if (forwardRefMatch) return forwardRefMatch[1];

  // memo<ButtonProps>(...) or React.memo<ButtonProps>(...)
  const memoMatch = initText.match(/memo\s*<\s*(\w+Props)\b/);
  if (memoMatch) return memoMatch[1];

  // Generic call with Props: someWrapper<ButtonProps>(...)
  const genericMatch = initText.match(/<\s*(\w+Props)\b/);
  if (genericMatch) return genericMatch[1];

  // Fallback: look for (props: ButtonProps) parameter pattern in arrow functions
  const paramMatch = initText.match(/\(\s*(?:props|{\s*\w)|(?:props)\s*:\s*(\w+Props)\b/);
  if (paramMatch && paramMatch[1]) return paramMatch[1];

  return null;
}

/**
 * Extract *Props reference from a function declaration's parameters.
 */
function extractPropsRefFromFunction(fnDecl) {
  const params = fnDecl.getParameters();
  if (params.length === 0) return null;

  const firstParam = params[0];
  const typeNode = firstParam.getTypeNode?.();
  if (!typeNode) return null;

  const match = typeNode.getText().match(/(\w+Props)\b/);
  return match ? match[1] : null;
}

function extractProps(decl) {
  const props = [];
  const kind = decl.getKind();

  if (kind === SyntaxKind.InterfaceDeclaration) {
    for (const member of decl.getProperties()) {
      props.push(extractPropInfo(member));
    }
  } else if (kind === SyntaxKind.TypeAliasDeclaration) {
    // For type aliases like: type XProps = BaseStyleXProps<{ ... }>
    // We need to find the type literal inside
    const typeNode = decl.getTypeNode();
    if (!typeNode) return props;

    // Walk the type to find object literal types
    const typeLiterals = findTypeLiterals(typeNode);
    for (const literal of typeLiterals) {
      for (const member of literal.getProperties()) {
        props.push(extractPropInfo(member));
      }
    }
  }

  // Fallback: if AST walk found nothing, use the type checker to resolve
  // inherited/extended/composed properties (e.g. interface extends, Omit<>, &)
  if (props.length === 0) {
    return extractPropsViaTypeChecker(decl);
  }

  return props;
}

/**
 * Type-checker fallback for extracting props when AST walk returns nothing.
 * Handles interfaces that extend external types, re-exported types, and
 * complex type compositions (Omit, Pick, intersections).
 */
function extractPropsViaTypeChecker(decl) {
  const props = [];
  try {
    const type = decl.getType();
    const properties = type.getProperties();
    if (properties.length === 0) return props;

    // React internals that should never appear in component props output
    const SKIP_PROPS = new Set(['key', 'ref']);

    for (const prop of properties) {
      const name = prop.getName();
      if (SKIP_PROPS.has(name)) continue;
      // Skip private/internal symbols (starting with _)
      if (name.startsWith('_')) continue;

      let typeText = 'unknown';
      try {
        const propType = prop.getTypeAtLocation(decl);
        typeText = propType.getText(decl);
        // Truncate very long type texts (e.g. union of 50 event handler types)
        if (typeText.length > 150) typeText = typeText.substring(0, 150) + '...';
      } catch { /* type resolution failed */ }

      const isOptional = prop.isOptional();

      // Try to get JSDoc and default from the declaration
      const declarations = prop.getDeclarations();
      const firstDecl = declarations[0];
      const jsDoc = firstDecl ? getJsDoc(firstDecl) : null;
      const defaultValue = firstDecl?.hasQuestionToken !== undefined ? extractDefault(firstDecl) : null;

      props.push({ name, type: typeText, required: !isOptional, description: jsDoc, default: defaultValue });
    }

    // If we got an unreasonable number (>50), we're likely inheriting React
    // HTMLAttributes. Strip out HTML/DOM noise and keep component-specific props.
    if (props.length > 50) {
      const HTML_ATTRS = new Set([
        'style', 'className', 'id', 'title', 'lang', 'dir', 'tabIndex', 'hidden',
        'slot', 'is', 'part', 'exportparts', 'inputMode', 'enterKeyHint',
        'autoFocus', 'contentEditable', 'draggable', 'spellCheck', 'translate',
        'about', 'content', 'datatype', 'prefix', 'property', 'rel', 'resource',
        'rev', 'typeof', 'vocab', 'color', 'results', 'security', 'unselectable',
        'nonce', 'accessKey', 'autoCapitalize', 'contextMenu', 'itemProp',
        'itemScope', 'itemType', 'itemID', 'itemRef', 'role', 'inert',
        'popover', 'popoverTarget', 'popoverTargetAction',
        'suppressContentEditableWarning', 'suppressHydrationWarning',
        'dangerouslySetInnerHTML',
      ]);
      const filtered = props.filter(p =>
        !p.name.startsWith('on') &&
        !p.name.startsWith('aria-') &&
        !HTML_ATTRS.has(p.name)
      );
      return filtered.length > 0 ? filtered : props.slice(0, 20);
    }
  } catch {
    // Type checker fallback failed entirely
  }
  return props;
}

function findTypeLiterals(node) {
  const literals = [];

  if (node.getKind() === SyntaxKind.TypeLiteral) {
    literals.push(node);
    return literals;
  }

  // Recurse into type arguments (e.g. BaseStyleXProps<{ ... }>)
  try {
    const typeArgs = node.getTypeArguments?.() || [];
    for (const arg of typeArgs) {
      literals.push(...findTypeLiterals(arg));
    }
  } catch { /* not all nodes have getTypeArguments */ }

  // Recurse into intersection types
  try {
    const types = node.getTypeNodes?.() || [];
    for (const t of types) {
      literals.push(...findTypeLiterals(t));
    }
  } catch { /* ignore */ }

  // Try getChildren as last resort for nested structures
  for (const child of node.getChildren()) {
    if (child.getKind() === SyntaxKind.TypeLiteral) {
      literals.push(child);
    }
  }

  return literals;
}

function extractPropInfo(member) {
  const name = member.getName();
  const typeNode = member.getTypeNode();
  const type = typeNode ? typeNode.getText() : 'unknown';
  const required = !member.hasQuestionToken();
  const jsDoc = getJsDoc(member);
  const defaultValue = extractDefault(member);

  return { name, type, required, description: jsDoc, default: defaultValue };
}

function getJsDoc(node) {
  const jsDocs = node.getJsDocs?.() || [];
  if (jsDocs.length === 0) return null;
  const doc = jsDocs[0];
  return doc.getDescription?.()?.trim() || doc.getText()?.replace(/^\/\*\*|\*\/$/g, '').replace(/^\s*\* ?/gm, '').trim() || null;
}

function extractDefault(member) {
  // Look for @default JSDoc tag
  const jsDocs = member.getJsDocs?.() || [];
  for (const doc of jsDocs) {
    const tags = doc.getTags?.() || [];
    for (const tag of tags) {
      if (tag.getTagName() === 'default') {
        return tag.getCommentText?.()?.trim() || tag.getText()?.replace(/@default\s*/, '').trim() || null;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Token Parser (direct file reading)
// ---------------------------------------------------------------------------

function parseTokens(repoPath) {
  const baseDir = path.join(repoPath, 'packages', 'base', 'src');
  const tokens = {};

  // 1. Color primitives
  tokens.colorPrimitives = parseStyleXDefineVars(
    path.join(baseDir, 'colorPrimitives.stylex.ts')
  );

  // 2. Semantic color tokens
  tokens.colors = parseStyleXDefineVars(
    path.join(baseDir, 'colorTokens.stylex.ts')
  );

  // 3. Global tokens (spacing, borders, shadows, breakpoints, fonts)
  const globalRaw = parseStyleXDefineVars(
    path.join(baseDir, 'globalTokens.stylex.ts')
  );
  tokens.spacing = {};
  tokens.borders = {};
  tokens.breakpoints = {};
  tokens.fonts = {};
  tokens.shadows = {};
  tokens.weights = {};
  tokens.easing = {};
  tokens.other = {};

  for (const [key, val] of Object.entries(globalRaw)) {
    if (key.startsWith('rpx')) tokens.spacing[key] = val;
    else if (key.startsWith('borderRadius')) tokens.borders[key] = val;
    else if (['sm', 'md', 'lg'].includes(key)) tokens.breakpoints[key] = val;
    else if (key.endsWith('Text')) tokens.fonts[key] = val;
    else if (key.startsWith('shadow') || key.startsWith('dropShadow')) tokens.shadows[key] = val;
    else if (key.endsWith('Weight')) tokens.weights[key] = val;
    else if (key.startsWith('ease')) tokens.easing[key] = val;
    else tokens.other[key] = val;
  }

  // 4. Box shadows
  tokens.elevation = parseStyleXDefineVars(
    path.join(baseDir, 'boxShadows.stylex.ts')
  );

  // 5. Typography
  tokens.typography = parseStyleXCreate(
    path.join(baseDir, 'textTokens.ts')
  );

  return tokens;
}

function parseStyleXDefineVars(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {};

  // Use ts-morph for accurate parsing of defineVars argument
  const project = new Project({
    compilerOptions: { jsx: 4 },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  const sourceFile = project.addSourceFileAtPath(filePath);

  // Find stylex.defineVars() call
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of callExpressions) {
    const expr = call.getExpression();
    if (expr.getText() !== 'stylex.defineVars') continue;

    const args = call.getArguments();
    if (args.length === 0) continue;

    const objLiteral = args[0];
    if (objLiteral.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;

    for (const prop of objLiteral.getProperties()) {
      if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;

      const name = prop.getName();
      const initializer = prop.getInitializer();

      // Get JSDoc from leading comments
      const jsDoc = extractLeadingComment(prop, content);

      if (!initializer) continue;

      if (initializer.getKind() === SyntaxKind.StringLiteral) {
        // Simple string value: tokenName: '#fff'
        result[name] = {
          value: initializer.getLiteralText(),
          description: jsDoc,
        };
      } else if (initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
        // Object with default: tokenName: { default: colorPrimitives.xxx }
        const defaultProp = initializer.getProperty('default');
        if (defaultProp) {
          const defaultInit = defaultProp.getInitializer?.();
          result[name] = {
            value: defaultInit?.getText() || 'unknown',
            description: jsDoc,
          };
        }
      } else if (initializer.getKind() === SyntaxKind.TemplateExpression ||
                 initializer.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
        // Template literal
        result[name] = {
          value: initializer.getText(),
          description: jsDoc,
        };
      } else {
        // Other expressions (property access like colorPrimitives.xxx)
        result[name] = {
          value: initializer.getText(),
          description: jsDoc,
        };
      }
    }
  }

  return result;
}

function parseStyleXCreate(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const result = {};
  const project = new Project({
    compilerOptions: { jsx: 4 },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  const sourceFile = project.addSourceFileAtPath(filePath);

  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of callExpressions) {
    const expr = call.getExpression();
    if (expr.getText() !== 'stylex.create') continue;

    const args = call.getArguments();
    if (args.length === 0) continue;

    const objLiteral = args[0];
    if (objLiteral.getKind() !== SyntaxKind.ObjectLiteralExpression) continue;

    for (const prop of objLiteral.getProperties()) {
      if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue;

      const name = prop.getName();
      const initializer = prop.getInitializer();

      if (initializer?.getKind() === SyntaxKind.ObjectLiteralExpression) {
        // Extract CSS properties from the style object
        const styleObj = {};
        for (const styleProp of initializer.getProperties()) {
          if (styleProp.getKind() !== SyntaxKind.PropertyAssignment) continue;
          const styleName = styleProp.getName();
          const styleValue = styleProp.getInitializer();
          if (styleValue) {
            // Get the raw value — could be string, number, or reference
            const text = styleValue.getText();
            // Try to extract literal value
            if (styleValue.getKind() === SyntaxKind.StringLiteral) {
              styleObj[styleName] = styleValue.getLiteralText();
            } else if (styleValue.getKind() === SyntaxKind.NumericLiteral) {
              styleObj[styleName] = Number(text);
            } else {
              styleObj[styleName] = text; // reference like colorTokens.xxx
            }
          }
        }
        result[name] = styleObj;
      }
    }
  }

  return result;
}

function extractLeadingComment(node, fullText) {
  // Get leading trivia (comments before the node)
  const leadingTrivia = node.getLeadingCommentRanges();
  if (leadingTrivia.length === 0) return null;

  const lastComment = leadingTrivia[leadingTrivia.length - 1];
  const commentText = lastComment.getText();

  // Parse JSDoc-style comment: /** ... */
  if (commentText.startsWith('/**')) {
    return commentText
      .replace(/^\/\*\*\s*/, '')
      .replace(/\s*\*\/$/, '')
      .replace(/^\s*\* ?/gm, '')
      .trim();
  }

  // Parse single-line comment: // ...
  if (commentText.startsWith('//')) {
    return commentText.replace(/^\/\/\s*/, '').trim();
  }

  return null;
}

// ---------------------------------------------------------------------------
// Icon Parser (regex-based, no ts-morph needed)
// ---------------------------------------------------------------------------

const ICON_CATEGORIES = ['Interface', 'Products', 'Social', 'SoFiX'];

function parseIcons(repoPath) {
  const iconsDir = path.join(repoPath, 'packages', 'icons', 'src', 'Icons');
  const icons = [];

  for (const category of ICON_CATEGORIES) {
    const catDir = path.join(iconsDir, category);
    if (!fs.existsSync(catDir)) continue;

    // Find the barrel file (index.ts or index.tsx)
    const barrelPath = fs.existsSync(path.join(catDir, 'index.ts'))
      ? path.join(catDir, 'index.ts')
      : path.join(catDir, 'index.tsx');

    if (!fs.existsSync(barrelPath)) continue;

    const barrelContent = fs.readFileSync(barrelPath, 'utf-8');

    // Parse: export { default as IconName } from './fileName';
    const exportRe = /export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from\s*'\.\/(\w+)'/g;
    let match;
    while ((match = exportRe.exec(barrelContent)) !== null) {
      const name = match[1];
      const fileName = match[2];

      // Read the source file to extract iconTitle and iconType
      let iconTitle = name;
      let iconType = 'solid';

      const srcFile = ['.tsx', '.ts'].map(ext => path.join(catDir, `${fileName}${ext}`)).find(f => fs.existsSync(f));
      if (srcFile) {
        try {
          const srcContent = fs.readFileSync(srcFile, 'utf-8');
          const titleMatch = srcContent.match(/iconTitle:\s*'([^']+)'/);
          if (titleMatch) iconTitle = titleMatch[1];
          const typeMatch = srcContent.match(/iconType:\s*'([^']+)'/);
          if (typeMatch) iconType = typeMatch[1];
        } catch { /* fall back to defaults */ }
      }

      icons.push({ name, category, iconType, iconTitle });
    }
  }

  return icons;
}

// ---------------------------------------------------------------------------
// Supernova Mapping
// ---------------------------------------------------------------------------

const SUPERNOVA_MAP_PATH = path.join(DATA_DIR, 'supernova-map.json');
const SUPERNOVA_CACHE = path.join(DATA_DIR, 'supernova');

/**
 * Build a mapping from sofi-web-ui components to Supernova documentation files.
 * Uses figmaGroup (from Code Connect) as the primary signal, then fuzzy name matching.
 *
 * Returns a map: { componentName: supernovaFile } (filename without .md extension)
 */
function buildSupernovaMap(components) {
  // Get available Supernova files
  if (!fs.existsSync(SUPERNOVA_CACHE)) return {};

  const supernovaFiles = fs.readdirSync(SUPERNOVA_CACHE)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));

  if (supernovaFiles.length === 0) return {};

  // Build normalized lookup: lowercase words → supernova file name
  const snNormalized = supernovaFiles.map(name => ({
    name,
    lower: name.toLowerCase(),
    words: tokenize(name),
  }));

  const mapping = {};

  // Collect unique figmaGroups and component names to map
  const figmaGroupComponents = new Map(); // figmaGroup -> [componentName, ...]
  const orphanComponents = []; // components without figmaGroup

  for (const comp of components) {
    if (comp.figmaGroup) {
      if (!figmaGroupComponents.has(comp.figmaGroup)) {
        figmaGroupComponents.set(comp.figmaGroup, []);
      }
      figmaGroupComponents.get(comp.figmaGroup).push(comp.name);
    } else {
      orphanComponents.push(comp.name);
    }
  }

  // 1. Match figmaGroups to Supernova files
  for (const [group, compNames] of figmaGroupComponents) {
    const match = findBestMatch(group, snNormalized);
    if (match) {
      for (const name of compNames) {
        mapping[name] = match;
      }
    }
  }

  // 2. Match orphan components by name (higher threshold — no Code Connect backing)
  for (const name of orphanComponents) {
    if (mapping[name]) continue; // already mapped
    const match = findBestMatch(name, snNormalized, 50);
    if (match) {
      mapping[name] = match;
    }
  }

  return mapping;
}

/** Tokenize a name into lowercase words: "ProgressStepper" -> ["progress", "stepper"] */
function tokenize(name) {
  return name
    // Split camelCase: "ProgressStepper" -> "Progress Stepper"
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Split on non-alpha
    .split(/[^a-zA-Z]+/)
    .filter(Boolean)
    .map(w => w.toLowerCase());
}

/**
 * Find the best matching Supernova file for a given name.
 * Scoring:
 *   - Exact match (case-insensitive): 100
 *   - Supernova name starts with or contains the query: 80
 *   - Query starts with or contains supernova name: 70
 *   - Word overlap: 10 * overlapping words
 *   - Singular/plural normalization bonus: +5
 *
 * Returns the supernova file name or null if no good match (score < 10).
 */
function findBestMatch(query, snNormalized, minScore = 10) {
  const qLower = query.toLowerCase();
  const qWords = tokenize(query);
  const qSingular = depluralize(qLower);

  let bestScore = 0;
  let bestMatch = null;

  for (const sn of snNormalized) {
    let score = 0;
    const snSingular = depluralize(sn.lower);

    // Exact match (also handle small typos via dedup of consecutive chars)
    if (qLower === sn.lower || qSingular === snSingular ||
        dedup(qLower) === dedup(sn.lower) || dedup(qSingular) === dedup(snSingular)) {
      score = 100;
    }
    // Supernova contains query or vice versa
    else if (sn.lower.includes(qLower) || qLower.includes(sn.lower)) {
      score = 80;
    }
    // Singular forms match
    else if (sn.lower.includes(qSingular) || qSingular.includes(snSingular)) {
      score = 75;
    }
    // Word overlap
    else {
      const overlap = qWords.filter(w => sn.words.some(sw =>
        sw === w || depluralize(sw) === depluralize(w)
      )).length;
      if (overlap > 0) {
        // Weight by what fraction of words match
        const coverage = overlap / Math.max(qWords.length, sn.words.length);
        score = 10 + (coverage * 60);
      }
    }

    // Prefer v2 over v1 when both exist (latest version)
    if (score > 0 && sn.lower.includes('v2')) {
      score += 2;
    }
    // Slight penalty for v1 to prefer non-versioned or v2
    if (score > 0 && sn.lower.includes('v1') && !sn.lower.includes('v2')) {
      score -= 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = sn.name;
    }
  }

  return bestScore >= minScore ? bestMatch : null;
}

/** Collapse consecutive duplicate chars: "acccordion" -> "acordion" */
function dedup(s) {
  return s.replace(/(.)\1+/g, '$1');
}

/** Simple depluralization: "Banners" -> "banner", "Loaders" -> "loader" */
function depluralize(s) {
  s = s.toLowerCase();
  if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
  if (s.endsWith('es') && !s.endsWith('sse')) return s.slice(0, -2);
  if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1);
  return s;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs();

  // Find repo
  const repoPath = findRepo(opts.repoPath);
  process.stderr.write(`Using repo at: ${repoPath}\n`);

  // Get sofi-web-ui version info for all indexed packages
  const pkgNames = ['core', 'base', 'form-inputs', 'icons'];
  const packages = {};
  for (const name of pkgNames) {
    const pkgPath = path.join(repoPath, 'packages', name, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      packages[pkg.name] = pkg.version;
    }
  }
  let commit = 'unknown';
  try {
    commit = execSync('git log -1 --format=%H', { cwd: repoPath, stdio: 'pipe' }).toString().trim();
  } catch { /* not a git repo or no git */ }

  // Parse components
  process.stderr.write('Parsing components...\n');
  const components = parseComponents(repoPath);
  process.stderr.write(`  Found ${components.length} component props interfaces\n`);

  // Parse tokens
  process.stderr.write('Parsing tokens...\n');
  const tokens = parseTokens(repoPath);
  const tokenCount = Object.values(tokens).reduce((sum, cat) => {
    if (typeof cat === 'object' && cat !== null) {
      return sum + Object.keys(cat).length;
    }
    return sum;
  }, 0);
  process.stderr.write(`  Found ${tokenCount} tokens across ${Object.keys(tokens).length} categories\n`);

  // Parse icons
  process.stderr.write('Parsing icons...\n');
  const icons = parseIcons(repoPath);
  process.stderr.write(`  Found ${icons.length} icons across ${ICON_CATEGORIES.length} categories\n`);

  // Build Supernova mapping (if Supernova data exists in data/)
  process.stderr.write('Building Supernova mapping...\n');
  const supernovaMap = buildSupernovaMap(components);
  const mappedCount = Object.keys(supernovaMap).length;
  process.stderr.write(`  Mapped ${mappedCount} components to Supernova docs\n`);

  // Enrich components with supernovaFile field
  for (const comp of components) {
    comp.supernovaFile = supernovaMap[comp.name] || null;
  }

  // Apply manual overrides (descriptions, metadata corrections)
  if (fs.existsSync(OVERRIDES_PATH)) {
    const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf-8'));
    let applied = 0;
    for (const comp of components) {
      const override = overrides[comp.name];
      if (override) {
        for (const [key, value] of Object.entries(override)) {
          if (key.startsWith('_')) continue;
          comp[key] = value;
        }
        applied++;
      }
    }
    process.stderr.write(`  Applied ${applied} component overrides\n`);
  }

  // Write to data/ directory
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(COMPONENTS_PATH, JSON.stringify(components, null, 2));
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
  fs.writeFileSync(ICONS_PATH, JSON.stringify(icons, null, 2));
  fs.writeFileSync(SUPERNOVA_MAP_PATH, JSON.stringify(supernovaMap, null, 2));

  // Write version manifest
  const version = {
    sofiWebUi: {
      commit,
      packages,
    },
    buildDate: new Date().toISOString().split('T')[0],
    componentCount: components.length,
    iconCount: icons.length,
    tokenCount,
    supernovaMapped: mappedCount,
  };
  fs.writeFileSync(VERSION_PATH, JSON.stringify(version, null, 2));

  const result = {
    status: 'indexed',
    componentCount: components.length,
    iconCount: icons.length,
    tokenCategories: Object.keys(tokens),
    tokenCount,
    supernovaMapped: mappedCount,
    dataDir: DATA_DIR,
    version,
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main().catch(err => {
  process.stdout.write(JSON.stringify({ status: 'error', message: err.message }) + '\n');
  process.exit(1);
});
