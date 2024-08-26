import path from 'path';
import {
  cleanPath,
  isValidPath,
  isDynamicPath,
  isCatchAllRoute,
  isOptionalCatchAllRoute,
  generateRoutes,
} from '../src/utils';

describe('utils', () => {
  describe('cleanPath', () => {
    it('should clean the path correctly', () => {
      const input = '/app/(auth)/login/page.tsx';
      const expected = '/login';
      expect(cleanPath(input, '/app')).toBe(expected);
    });
  });

  describe('isValidPath', () => {
    it('should return true for valid paths', () => {
      expect(isValidPath('validPath')).toBe(true);
    });

    it('should return false for paths starting with underscore', () => {
      expect(isValidPath('_invalidPath')).toBe(false);
    });

    it('should return false for paths starting with dot', () => {
      expect(isValidPath('.invalidPath')).toBe(false);
    });
  });

  describe('isDynamicPath', () => {
    it('should return true for dynamic paths', () => {
      expect(isDynamicPath('[id]')).toBe(true);
    });

    it('should return false for static paths', () => {
      expect(isDynamicPath('static')).toBe(false);
    });
  });

  describe('isCatchAllRoute', () => {
    it('should return true for catch-all routes', () => {
      expect(isCatchAllRoute('[...slug]')).toBe(true);
    });

    it('should return false for non-catch-all routes', () => {
      expect(isCatchAllRoute('[id]')).toBe(false);
    });
  });

  describe('isOptionalCatchAllRoute', () => {
    it('should return true for optional catch-all routes', () => {
      expect(isOptionalCatchAllRoute('[[...slug]]')).toBe(true);
    });

    it('should return false for non-optional catch-all routes', () => {
      expect(isOptionalCatchAllRoute('[...slug]')).toBe(false);
    });
  });

  describe('generateRoutes', () => {
    it('should generate routes correctly', async () => {
      const mockAppDir = path.join(__dirname, 'mock-app');
      const routes = await generateRoutes(mockAppDir);

      expect(routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/about' }),
          expect.objectContaining({ path: '/blog/[slug]', isDynamic: true }),
          expect.objectContaining({
            path: '/products/[...categories]',
            isCatchAll: true,
          }),
          expect.objectContaining({
            path: '/settings/[[...sections]]',
            isOptionalCatchAll: true,
          }),
        ]),
      );
    });
  });
});
