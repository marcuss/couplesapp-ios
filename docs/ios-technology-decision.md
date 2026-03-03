# iOS Technology Decision — CouplePlan

**Date:** 2026-03-02  
**Status:** ✅ Decided — Capacitor  
**Author:** Marcus Sanchez

---

## Background

CouplePlan is a React + TypeScript + Vite web application backed by Supabase. The goal is to deploy it as a native iOS application with minimal code rewrite, full feature parity, and a solid test suite.

## Options Evaluated

### 1. Apache Cordova

| Aspect | Assessment |
|--------|-----------|
| Architecture | Wraps web app in WebView |
| TypeScript support | Via community plugins |
| Plugin ecosystem | Mature but aging |
| Build tooling | CLI-based, complex config |
| Maintenance | Active but declining; Ionic fork (Capacitor) is the future |
| iOS 16+ support | Works but requires manual updates |

**Pros:**
- Proven, long track record
- Large plugin ecosystem (thousands of plugins)
- No code rewrite needed

**Cons:**
- Older toolchain; configuration is verbose
- Plugin quality is inconsistent
- Slower release cadence
- Capacitor supersedes it as the modern alternative
- Poor TypeScript-first support

---

### 2. React Native

| Aspect | Assessment |
|--------|-----------|
| Architecture | Native components, no WebView |
| TypeScript support | First-class |
| Code rewrite required | **Full rewrite** — JSX components, navigation, styling all differ |
| Performance | Excellent native performance |
| Learning curve | High for web-first developers |

**Pros:**
- True native performance and UI components
- Strong community, backed by Meta
- Excellent TypeScript support
- Large ecosystem

**Cons:**
- **Complete rewrite required** — React components must be rewritten to React Native (no HTML, CSS, or DOM APIs)
- Tailwind CSS does not work; must use StyleSheet API
- Supabase SDK works but all UI must be rebuilt
- Router (react-router-dom) must be replaced with React Navigation
- Development time: 4–8 weeks minimum
- Testing stack changes: no DOM, Detox/RNTL required
- **Not viable** given our time constraint and existing codebase

---

### 3. Expo (React Native framework)

| Aspect | Assessment |
|--------|-----------|
| Architecture | Built on React Native, adds managed workflow |
| TypeScript support | First-class |
| Code rewrite required | **Full rewrite** (same as React Native) |
| Build service | Expo EAS (cloud builds) |
| Over-the-air updates | Yes, via Expo Updates |

**Pros:**
- Excellent DX with managed workflow
- Over-the-air updates via Expo Updates
- Expo Router (file-based routing)
- Good TypeScript + ESLint setup out of the box

**Cons:**
- Same fundamental problem as React Native: **complete rewrite required**
- Managed workflow restricts native module access
- Ejecting (bare workflow) adds complexity
- **Not viable** given existing React/Vite codebase

---

### 4. ✅ Capacitor (Selected)

| Aspect | Assessment |
|--------|-----------|
| Architecture | Web app in native WebView + native bridge |
| TypeScript support | First-class; written in TypeScript |
| Code rewrite required | **Zero** — existing React/Vite app unchanged |
| Supabase SDK | Works without modification |
| Tailwind CSS | Works without modification |
| React Router | Works without modification |
| Plugin ecosystem | Growing official plugins + community |
| Maintainer | Ionic team; active development |
| iOS 16+ support | Full support |
| Android support | Yes, same codebase |

**Pros:**
- **Zero code rewrite** — wrap the existing build artifact (`dist/`) in a native shell
- Modern successor to Cordova with better DX
- TypeScript-first design: `capacitor.config.ts` is typed
- Official native plugins for common needs: App, Keyboard, StatusBar, Haptics, Camera
- Supabase JS SDK works identically in Capacitor (same browser JS environment)
- Vitest + @testing-library/react work unchanged for unit tests
- Playwright can target the web build for e2e tests
- iOS safe-area CSS variables supported via WKWebView
- Native deep linking for invitation tokens (`/invitation/:token`)
- Live-reload during development: `npx cap run ios`
- Build integration: `npm run build && npx cap sync ios`

**Cons:**
- Performance ceiling lower than React Native (WebView-based)
- Complex native UI patterns require native plugins or workarounds
- App Store review may be stricter for WebView apps (but thousands of Capacitor apps are published)

---

## Decision

**Capacitor** is chosen for the following reasons:

1. **Zero code rewrite** — The React + Vite app is wrapped as-is. All existing components, routing, styling, and Supabase calls work unchanged.
2. **Time efficiency** — From web app to installable iOS build in minutes, not weeks.
3. **Modern architecture** — Capacitor is the actively-maintained spiritual successor to Cordova with full TypeScript support.
4. **Test compatibility** — Existing test infrastructure (Vitest, @testing-library/react, MSW) continues to work. No tooling changes.
5. **SDK compatibility** — Supabase JS SDK works natively in WKWebView (same JS engine as Safari).
6. **iOS safe-area support** — WKWebView provides `env(safe-area-inset-*)` CSS variables for iPhone notch/Dynamic Island handling.

---

## Implementation Plan

### Step 1 — Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
```

### Step 2 — Configure (`capacitor.config.ts`)
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nextasy.couplesapp',
  appName: 'CouplePlan',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

### Step 3 — Add iOS Platform
```bash
npx cap add ios
```

### Step 4 — Build and Sync
```bash
npm run build
npx cap sync ios
```

### Step 5 — iOS-Specific CSS Adjustments
Add safe-area insets to handle iPhone notch and home indicator:
```css
/* In index.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Step 6 — Vite Config for Capacitor
Ensure `base: '/'` is set (already default) and output dir is `dist`:
```typescript
// vite.config.ts
export default defineConfig({
  base: '/',
  build: { outDir: 'dist' }
})
```

### Step 7 — Deep Link for Invitations
Configure universal links in `capacitor.config.ts` for `/invitation/:token` routes.

---

## Testing Strategy

| Level | Tool | Scope |
|-------|------|-------|
| Unit | Vitest + @testing-library/react | Components, hooks, auth logic |
| Integration | Vitest + MSW (Mock Service Worker) | Supabase calls mocked |
| E2E | Playwright | Web build (same logic as app) |
| Native | Xcode Simulator | Manual smoke tests |

Test files are co-located under `src/__tests__/` following the Gherkin scenarios in `docs/features.feature`.

---

## App Store Considerations

- Bundle ID: `com.nextasy.couplesapp`
- App Name: CouplePlan
- Capacitor apps are accepted on the App Store; Ionic publishes thousands of them
- Privacy manifest required for iOS 17+ (`PrivacyInfo.xcprivacy`)
- Supabase calls go to `rdmjheytzgnewwslgbtk.supabase.co` — ensure this domain is listed in `NSAppTransportSecurity` if needed
