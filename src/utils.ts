import fs from 'fs/promises';
import path from 'path';
import { APP_DIR, VALID_PAGE_EXTENTIONS } from './config';
import { FSTreeWalker, Route } from './types';

const cleanPath = (filePath: string, appDir: string = APP_DIR): string => {
  return filePath
    .replace(appDir, '')
    .replace(/\(.*\)/g, '')
    .replace(/\/$/, '')
    .replace(/^\/\//, '/')
    .replace(/\.[a-z]+$/, '')
    .replace(/\/page$/, '')
    .replace(/\/{2,}/g, '/');
};

const isValidPath = (p: string): boolean =>
  !p.startsWith('_') && !p.startsWith('.');

const walk = async (dir: string): Promise<FSTreeWalker> => {
  const paths = await fs.readdir(dir);
  const tree: FSTreeWalker = {
    base: dir,
    paths: [],
  };

  for (const p of paths) {
    const fullPath = path.join(dir, p);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory() && isValidPath(p)) {
      tree.paths.push(await walk(fullPath));
    } else {
      tree.paths.push({
        base: fullPath,
        paths: [],
      });
    }
  }
  return tree;
};

const isDynamicPath = (base: string): boolean =>
  base.includes('[') && base.includes(']');
const isCatchAllRoute = (base: string): boolean => base.includes('[...');
const isOptionalCatchAllRoute = (base: string): boolean =>
  base.includes('[[...');

const generateRoutes = async (appDir: string): Promise<Route[]> => {
  const tree = await walk(appDir);
  const routes: Route[] = [];

  const traverse = (tree: FSTreeWalker) => {
    for (const path of tree.paths) {
      const { base } = path;
      const isDynamic = isDynamicPath(base);
      const isCatchAll = isCatchAllRoute(base);
      const isOptionalCatchAll = isOptionalCatchAllRoute(base);

      let params: Record<string, string | string[]> = {};
      if (isDynamic) {
        const paramMatches = base.match(/\[(.*?)\]/g);
        if (paramMatches) {
          params = Object.fromEntries(
            paramMatches.map((param) => {
              const key = param.replace(/\[|\]/g, '');
              return [key, key.startsWith('...') ? [] : ''];
            }),
          );
        }
      }

      routes.push({
        path: base,
        isDynamic,
        isCatchAll,
        isOptionalCatchAll,
        params,
      });

      traverse(path);
    }
  };

  traverse(tree);

  return routes
    .filter((route) => {
      const { path: routePath } = route;
      const name = routePath.split('/').pop();
      const ext = name?.split('.').pop();
      return (
        VALID_PAGE_EXTENTIONS.includes('.' + ext!) &&
        name!.split('.').shift() === 'page'
      );
    })
    .map((route) => ({
      ...route,
      path: cleanPath(route.path, appDir),
    }))
    .filter((route) => route.path !== '')
    .map((route) => ({
      ...route,
      path: route.path === '/' ? route.path : route.path.replace(/\/$/, ''),
    }));
};

const getRoutesMap = async (appDir: string): Promise<Record<string, Route>> => {
  const routes = await generateRoutes(appDir);
  return Object.fromEntries(routes.map((route) => [route.path, route]));
};

export { cleanPath, generateRoutes, getRoutesMap, walk };
export type { FSTreeWalker };
export { isValidPath, isDynamicPath, isCatchAllRoute, isOptionalCatchAllRoute };
