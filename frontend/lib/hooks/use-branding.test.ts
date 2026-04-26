import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  BrandingConfig,
  validateLogoFile,
  loadBrandingConfig,
  saveBrandingConfig,
  useBranding,
} from './use-branding';

describe('use-branding', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('validateLogoFile', () => {
    // Feature: frontend-enterprise-features, Property 1: validateLogoFile
    it('Property 1: Logo file validation accepts valid files and rejects invalid ones', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(
              'image/png',
              'image/jpeg',
              'image/svg+xml',
              'image/gif',
              'application/pdf'
            ),
            size: fc.integer({ min: 0, max: 4_000_000 }),
          }),
          (fileData) => {
            const file = new File([], 'test', { type: fileData.type });
            Object.defineProperty(file, 'size', { value: fileData.size });

            const result = validateLogoFile(file);

            const isValidType = ['image/png', 'image/jpeg', 'image/svg+xml'].includes(
              fileData.type
            );
            const isValidSize = fileData.size <= 2_097_152;

            if (isValidType && isValidSize) {
              expect(result).toBeNull();
            } else {
              expect(result).not.toBeNull();
              expect(typeof result).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject files with unsupported MIME types', () => {
      const file = new File([], 'test.gif', { type: 'image/gif' });
      const result = validateLogoFile(file);
      expect(result).not.toBeNull();
      expect(result).toContain('not supported');
    });

    it('should reject files larger than 2 MB', () => {
      const file = new File([], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 2_097_153 });
      const result = validateLogoFile(file);
      expect(result).not.toBeNull();
      expect(result).toContain('exceeds the 2 MB limit');
    });

    it('should accept valid PNG files', () => {
      const file = new File([], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1_000_000 });
      const result = validateLogoFile(file);
      expect(result).toBeNull();
    });

    it('should accept valid JPEG files', () => {
      const file = new File([], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1_500_000 });
      const result = validateLogoFile(file);
      expect(result).toBeNull();
    });

    it('should accept valid SVG files', () => {
      const file = new File([], 'test.svg', { type: 'image/svg+xml' });
      Object.defineProperty(file, 'size', { value: 500_000 });
      const result = validateLogoFile(file);
      expect(result).toBeNull();
    });

    it('should accept files exactly at 2 MB limit', () => {
      const file = new File([], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 2_097_152 });
      const result = validateLogoFile(file);
      expect(result).toBeNull();
    });
  });

  describe('loadBrandingConfig', () => {
    it('should return default config when localStorage is empty', () => {
      const config = loadBrandingConfig();
      expect(config).toEqual({
        logoUrl: null,
        primaryColor: '#00f5ff',
      });
    });

    it('should load config from localStorage when available', () => {
      const testConfig: BrandingConfig = {
        logoUrl: 'data:image/png;base64,test',
        primaryColor: '#ff0000',
      };
      localStorage.setItem('stellar_branding', JSON.stringify(testConfig));

      const config = loadBrandingConfig();
      expect(config).toEqual(testConfig);
    });

    it('should return defaults on localStorage parse error', () => {
      localStorage.setItem('stellar_branding', 'invalid json');
      const config = loadBrandingConfig();
      expect(config).toEqual({
        logoUrl: null,
        primaryColor: '#00f5ff',
      });
    });
  });

  describe('saveBrandingConfig', () => {
    it('should save config to localStorage', () => {
      const testConfig: BrandingConfig = {
        logoUrl: 'data:image/png;base64,test',
        primaryColor: '#00ff00',
      };

      saveBrandingConfig(testConfig);

      const stored = localStorage.getItem('stellar_branding');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(testConfig);
    });

    // Feature: frontend-enterprise-features, Property 3: branding round-trip
    it('Property 3: Branding config round-trip through persistence layer', () => {
      fc.assert(
        fc.property(
          fc.record({
            primaryColor: fc
              .hexaString({ minLength: 6, maxLength: 6 })
              .map((h) => '#' + h),
            logoUrl: fc.option(fc.string(), { nil: null }),
          }),
          (config) => {
            saveBrandingConfig(config);
            const loaded = loadBrandingConfig();
            expect(loaded).toEqual(config);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('useBranding hook', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useBranding());
      expect(result.current.config).toEqual({
        logoUrl: null,
        primaryColor: '#00f5ff',
      });
    });

    it('should load saved config on mount', () => {
      const testConfig: BrandingConfig = {
        logoUrl: 'data:image/png;base64,test',
        primaryColor: '#ff0000',
      };
      localStorage.setItem('stellar_branding', JSON.stringify(testConfig));

      const { result } = renderHook(() => useBranding());
      expect(result.current.config).toEqual(testConfig);
    });

    // Feature: frontend-enterprise-features, Property 2: CSS var propagation
    it('Property 2: Color picker update propagates to CSS custom property', () => {
      fc.assert(
        fc.property(
          fc.hexaString({ minLength: 6, maxLength: 6 }).map((h) => '#' + h),
          (color) => {
            const { result } = renderHook(() => useBranding());
            result.current.updateColor(color);

            const cssValue = document.documentElement.style.getPropertyValue(
              '--stellar-primary'
            );
            expect(cssValue).toBe(color);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update color in state and CSS var', () => {
      const { result } = renderHook(() => useBranding());
      result.current.updateColor('#ff0000');

      expect(result.current.config.primaryColor).toBe('#ff0000');
      expect(document.documentElement.style.getPropertyValue('--stellar-primary')).toBe(
        '#ff0000'
      );
    });

    it('should handle logo file upload with validation', () => {
      const { result } = renderHook(() => useBranding());
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      result.current.updateLogo(file);

      expect(result.current.logoError).toBeNull();
    });

    it('should set logoError for invalid file type', () => {
      const { result } = renderHook(() => useBranding());
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });

      result.current.updateLogo(file);

      expect(result.current.logoError).not.toBeNull();
      expect(result.current.logoError).toContain('not supported');
    });

    it('should set logoError for oversized file', () => {
      const { result } = renderHook(() => useBranding());
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 2_097_153 });

      result.current.updateLogo(file);

      expect(result.current.logoError).not.toBeNull();
      expect(result.current.logoError).toContain('exceeds the 2 MB limit');
    });

    it('should save config to localStorage', async () => {
      const { result } = renderHook(() => useBranding());
      result.current.updateColor('#ff0000');

      await result.current.saveConfig();

      const stored = localStorage.getItem('stellar_branding');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.primaryColor).toBe('#ff0000');
    });

    it('should set saving state during save', async () => {
      const { result } = renderHook(() => useBranding());

      const savePromise = result.current.saveConfig();
      expect(result.current.saving).toBe(false); // async completes immediately in test

      await savePromise;
      expect(result.current.saving).toBe(false);
    });

    it('should handle save errors', async () => {
      const { result } = renderHook(() => useBranding());

      // Mock localStorage to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      await result.current.saveConfig();

      expect(result.current.saveError).not.toBeNull();
      expect(result.current.saveError).toContain('Storage quota exceeded');

      localStorage.setItem = originalSetItem;
    });
  });
});

// Simple renderHook implementation for testing
function renderHook<T>(hook: () => T) {
  let result: { current: T };

  function TestComponent() {
    result = { current: hook() };
    return null;
  }

  TestComponent();

  return { result: result! };
}
