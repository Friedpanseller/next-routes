import fs from 'fs/promises';
import path from 'path';
import { APP_DIR, VALID_PAGE_EXTENTIONS } from './config';
import { FSTreeWalker, Route } from './types';

const cleanPath = (filePath: string, appDir: string = APP_DIR): string => {
  const sep = path.sep.replace(/\\/g, '\\\\'); // Escape for Windows paths
  const regex = (pattern: string) => new RegExp(pattern.replaceAll('/', sep), 'g');

  return filePath
    .replace(appDir, '') // Remove base app directory
    .replace(/\(.*\)/g, '') // Remove parentheses
    .replace(regex('/$'), '') // Remove trailing slash
    .replace(regex('^//'), '/') // Normalize double leading slashes
    .replace(/\.[a-z]+$/, '') // Remove file extensions
    .replace(regex('/page$'), '') // Remove '/page' at the end
    .replace(regex('/route$'), '') // Remove '/route' at the end
    .replace(regex('/{2,}'), '/'); // Collapse multiple slashes
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
      const name = routePath.split(path.sep).pop();
      const ext = name?.split('.').pop();
      return (
        VALID_PAGE_EXTENTIONS.includes('.' + ext!) &&
        (name!.split('.').shift() === 'page' || name!.split('.').shift() === 'route')
      );
    })
    .map((route) => ({
      ...route,
      path: cleanPath(route.path, appDir),
    }))
    .filter((route) => route.path !== '')
    .map((route) => ({
      ...route,
      path: route.path === path.sep ? route.path : route.path.replace(new RegExp(`${path.sep}$`), ''),
    }));
};

const getRoutesMap = async (appDir: string): Promise<Record<string, Route>> => {
  const routes = await generateRoutes(appDir);
  return Object.fromEntries(routes.map((route) => [route.path, route]));
};

export { cleanPath, generateRoutes, getRoutesMap, isCatchAllRoute, isDynamicPath, isOptionalCatchAllRoute, isValidPath, walk };
export type { FSTreeWalker };

