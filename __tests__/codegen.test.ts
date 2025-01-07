import fs from 'fs/promises';
import { generateDeclarations, generateLinkFunction } from '../src/codegen';
import { getRoutesMap } from '../src/utils';

jest.mock('fs/promises');
jest.mock('../src/utils');

describe('codegen', () => {
  const mockAppDir = '/mock/app';
  const mockDeclarationPath = '/mock/declarations.d.ts';
  const mockUtilsPath = '/mock/utils.ts';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('generateDeclarations', () => {
    it('should generate declarations correctly', async () => {
      const mockRoutesMap = {
        '/': { path: '/', params: {}, isDynamic: false },
        '/blog/[slug]': {
          path: '/blog/[slug]',
          params: { slug: '' },
          isDynamic: true,
        },
      };

      (getRoutesMap as jest.Mock).mockResolvedValue(mockRoutesMap);

      await generateDeclarations(mockAppDir, mockDeclarationPath);

      expect(fs.writeFile).toHaveBeenCalledWith(
        mockDeclarationPath,
        expect.stringContaining('const routes ='),
      );
    });
  });

  describe('generateLinkFunction', () => {
    it('should generate link function correctly', async () => {
      const mockRoutesMap = {
        '/': { path: '/', params: {}, isDynamic: false },
        '/blog/[slug]': {
          path: '/blog/[slug]',
          params: { slug: '' },
          isDynamic: true,
        },
      };

      (getRoutesMap as jest.Mock).mockResolvedValue(mockRoutesMap);

      await generateLinkFunction(mockAppDir, mockUtilsPath);

      expect(fs.writeFile).toHaveBeenCalledWith(
        mockUtilsPath,
        expect.stringContaining('const link$ ='),
      );
    });
  });
});
