import path from 'path';
import { NextRoutesOptions } from './types';

const resolveFromRoot = (...paths: string[]) =>
  path.resolve(process.cwd(), ...paths);

export const APP_DIR = resolveFromRoot('src/app');
export const TYPES_DIR = resolveFromRoot('node_modules/@types', 'next-routes');

const VALID_PAGE_EXTENTIONS = ['.tsx', '.ts', '.js', '.jsx', '.mdx'];
const defaultNextRoutesOptions: NextRoutesOptions = {
  appDir: APP_DIR,
  declarationPath: resolveFromRoot(TYPES_DIR, 'index.d.ts'),
  utilsPath: resolveFromRoot(APP_DIR, '..', 'lib', 'link$.ts'),
};

export { VALID_PAGE_EXTENTIONS, defaultNextRoutesOptions };
