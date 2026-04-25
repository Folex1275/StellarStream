# Implementation Plan: Global Flow i18n

## Overview

Integrate `next-intl` into the StellarStream Next.js frontend, create translation catalogs for English, Spanish, French, and Portuguese, localize all key components, and add a glass-style language switcher to the footer.

## Tasks

- [ ] 1. Install and configure next-intl
  - Install `next-intl` and `fast-check` (for property tests) via npm
  - Create `frontend/i18n.ts` with supported locales `["en", "es", "fr", "pt"]` and default locale `"en"`
  - Update `frontend/next.config.ts` to wrap with `createNextIntlPlugin`
  - Create `frontend/middleware.ts` with locale detection, cookie setting, and URL rewriting using `createMiddleware` from `next-intl/middleware` with `localePrefix: "as-needed"`
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create translation catalogs
  - [ ] 2.1 Create English catalog at `public/locales/en/common.json`
    - Include all namespaces: `nav`, `footer`, `hero`, `features`, `onboarding`, `dashboard`
    - Use the canonical key structure defined in the design document
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 2.2 Create Spanish, French, and Portuguese catalogs
    - Create `public/locales/es/common.json`, `public/locales/fr/common.json`, `public/locales/pt/common.json`
    - Each must contain the exact same set of Translation_Keys as the `en` catalog
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 2.3 Write property test: catalog key completeness
    - **Property 1: Translation catalog completeness**
    - For any non-`en` locale, assert its key set equals the `en` key set (deep key enumeration)
    - **Validates: Requirements 2.4**
    - Tag: `Feature: global-flow-i18n, Property 1: catalog completeness`

- [ ] 3. Implement locale utilities
  - Create `frontend/lib/locale-utils.ts` with `SUPPORTED_LOCALES`, `getStoredLocale`, `setStoredLocale`, `detectBrowserLocale`, and `isSupported`
  - `getStoredLocale` reads `localStorage.getItem("stellarstream_locale")` and validates it
  - `setStoredLocale` writes to `localStorage` and handles SSR (typeof window check)
  - `detectBrowserLocale` maps `navigator.language` to the closest supported locale, falling back to `"en"`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.1 Write property test: locale persistence round-trip
    - **Property 3: Locale persistence round-trip**
    - For any supported locale, `setStoredLocale(L)` then `getStoredLocale()` returns `L`
    - Mock `localStorage` in tests
    - **Validates: Requirements 3.1, 3.2**
    - Tag: `Feature: global-flow-i18n, Property 3: locale persistence round-trip`

  - [ ]* 3.2 Write property test: browser locale detection
    - **Property 4: Browser locale detection maps to supported locale**
    - For any arbitrary string passed as `navigator.language`, `detectBrowserLocale()` returns a member of `SUPPORTED_LOCALES`
    - Use `fc.string()` to generate arbitrary language strings
    - **Validates: Requirements 3.3, 3.4**
    - Tag: `Feature: global-flow-i18n, Property 4: browser locale detection`

  - [ ]* 3.3 Write property test: isSupported consistency
    - **Property 5: isSupported is consistent with SUPPORTED_LOCALES**
    - For any string `s`, `isSupported(s)` returns `true` iff `s` is in `SUPPORTED_LOCALES`
    - **Validates: Requirements 1.2**
    - Tag: `Feature: global-flow-i18n, Property 5: isSupported consistency`

- [ ] 4. Update root layout for locale-aware rendering
  - Restructure `frontend/app/` to use `[locale]` dynamic segment: move `layout.tsx` and `page.tsx` under `app/[locale]/`
  - Update `app/[locale]/layout.tsx` to accept `locale` param, set `<html lang={locale}>`, and wrap with `NextIntlClientProvider`
  - Load messages in layout using `getMessages()` from `next-intl/server`
  - _Requirements: 1.6, 6.1_

  - [ ]* 4.1 Write property test: html lang attribute
    - **Property 6: lang attribute reflects Active_Locale**
    - Render the layout with each supported locale and assert `html[lang]` equals the locale
    - **Validates: Requirements 6.1**
    - Tag: `Feature: global-flow-i18n, Property 6: html lang attribute`

- [ ] 5. Implement LanguageSwitcher component
  - Create `frontend/components/language-switcher.tsx` as a Client Component
  - Render a trigger button with a globe icon (`lucide-react Globe`) and the current locale's human-readable label
  - On click, show a dropdown listing all 4 locales with their native labels
  - On locale select: call `setStoredLocale`, use `next-intl`'s `useRouter().replace` to switch locale, close dropdown
  - Style with Glass_Style: `bg-[#030303]/95 backdrop-blur-xl border border-white/10 rounded-xl`
  - Add `aria-label="Select language"` to trigger button
  - Add `aria-label={nativeLabel}` to each dropdown option
  - Implement Escape key handler to close dropdown and return focus to trigger
  - Implement focus trap within open dropdown
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 6.2, 6.3_

  - [ ]* 5.1 Write property test: language switcher label display
    - **Property 8: Language switcher displays correct label for Active_Locale**
    - For any supported locale, render `LanguageSwitcher` with that locale active and assert the displayed label matches `LOCALE_LABELS[locale].nativeLabel`
    - **Validates: Requirements 4.2**
    - Tag: `Feature: global-flow-i18n, Property 8: language switcher label display`

  - [ ]* 5.2 Write property test: aria-label native names
    - **Property 9: Dropdown options have aria-label in native language**
    - For any supported locale option rendered in the dropdown, assert `aria-label` equals the locale's native label string
    - **Validates: Requirements 6.3**
    - Tag: `Feature: global-flow-i18n, Property 9: aria-label native names`

  - [ ]* 5.3 Write unit tests for LanguageSwitcher interactions
    - Test: dropdown opens on click, closes on Escape, closes on locale selection
    - Test: `aria-label="Select language"` present on trigger
    - Test: globe icon rendered
    - _Requirements: 4.3, 4.7, 4.8, 6.2_

- [ ] 6. Localize Nav component
  - Replace all hardcoded strings in `frontend/components/nav.tsx` with `useTranslations("nav")` calls
  - Keys: `nav.about`, `nav.howItWorks`, `nav.assets`, `nav.faq`, `nav.connect`, `nav.connected`
  - _Requirements: 5.1_

- [ ] 7. Localize Footer component and add LanguageSwitcher
  - Replace all hardcoded strings in `frontend/components/footer.tsx` with `useTranslations("footer")` calls
  - Import and render `<LanguageSwitcher />` in the bottom bar alongside the copyright notice
  - _Requirements: 4.1, 5.2_

- [ ] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Localize landing page components
  - [ ] 9.1 Localize HeroSection
    - Replace hardcoded strings in `frontend/components/landing/hero-section.tsx` with `useTranslations("hero")`
    - _Requirements: 5.3_

  - [ ] 9.2 Localize FeatureBentoSection
    - Replace hardcoded feature data array in `frontend/components/landing/feature-bento-section.tsx` with translated strings via `useTranslations("features")`
    - _Requirements: 5.4_

  - [ ]* 9.3 Write property test: component localization
    - **Property 7: Components render translated strings for all locales**
    - For any supported non-`en` locale, render each localized component and assert the output does not contain the hardcoded English strings (e.g., "Your keys to real-time asset flow" should not appear when locale is `es`)
    - **Validates: Requirements 5.1–5.6**
    - Tag: `Feature: global-flow-i18n, Property 7: component localization`

- [ ] 10. Localize Onboarding and Dashboard components
  - [ ] 10.1 Localize OnboardingPage
    - Replace all hardcoded strings in `frontend/app/onboarding/page.tsx` and `frontend/components/onboarding/` with `useTranslations("onboarding")`
    - _Requirements: 5.5_

  - [ ] 10.2 Localize Sidebar
    - Replace all hardcoded strings in `frontend/components/dashboard/sidebar.tsx` with `useTranslations("dashboard")`
    - _Requirements: 5.6_

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `next-intl` with `localePrefix: "as-needed"` means `/dashboard` stays as-is for `en`; non-default locales get `/es/dashboard` etc.
- Property tests use `fast-check` with `numRuns: 100` minimum
- The `[locale]` App Router restructure is the most impactful change — do it early (Task 4) to unblock component work
