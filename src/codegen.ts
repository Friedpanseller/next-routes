import fs from 'fs/promises';
import { getRoutesMap } from './utils';

const getRoutesDeclaration = async (appDir: string) => {
  const routesMap = await getRoutesMap(appDir);
  return `const routes = ${JSON.stringify(routesMap, null, 2)};
declare type RoutesOutput = typeof routes;`;
};

const getLinkFunction = async (appDir: string) => {
  const routesMap = await getRoutesMap(appDir);
  return `
import { ParsedUrlQueryInput } from 'querystring';

export const routes = ${JSON.stringify(routesMap, null, 2)};

type IsEmptyObject<T> = keyof T extends never ? true : false;

type Link$Options<T extends keyof RoutesOutput = keyof RoutesOutput> =
  IsEmptyObject<RoutesOutput[T]["params"]> extends false
    ? {
        href: T;
        params: {
          [K in keyof RoutesOutput[T]["params"]]: RoutesOutput[T]["params"][K] extends any[]
            ? string[]
            : string
        };
        query?: ParsedUrlQueryInput;
        hash?: string;
      }
    : {
        href: T;
        params?: {
          [K in keyof RoutesOutput[T]["params"]]: RoutesOutput[T]["params"][K] extends any[]
            ? string[]
            : string
        };
        query?: ParsedUrlQueryInput;
        hash?: string;
      };

type RoutesOutput = typeof routes;

const link$ = <T extends keyof RoutesOutput = keyof RoutesOutput>({
  href,
  params,
  query,
  hash,
}: Link$Options<T>): string => {
  const route = routes[href];
  let path = route.path;

  if (route.isDynamic) {
    const paramsKeys = Object.keys(params!);
    const paramsValues = Object.values(params!);
    path = paramsKeys.reduce((acc, key, index) => {
      return acc.replace(\`[\${key}]\`, paramsValues[index] as string);
    }, route.path);
  }

  if (route.isCatchAll || route.isOptionalCatchAll) {
   const catchAllParam = Object.values(params!)[0] as string | string[];
path = path.replace(/\\[\\.{3}.+\\]/, Array.isArray(catchAllParam) ? catchAllParam.join('/') : catchAllParam);
  }

  if (query) {
    const queryString = new URLSearchParams(query as Record<string, string>).toString();
    path += \`?\${queryString}\`;
  }

  if (hash) {
    path += \`#\${hash}\`;
  }

  return path;
};

export default link$;`;
};

const writeFile = async (path: string, data: string) => {
  await fs.writeFile(path, data);
};

const generateDeclarations = async (
  appDir: string,
  declarationPath: string,
) => {
  const routesDeclarationFile = await getRoutesDeclaration(appDir);
  await writeFile(declarationPath, routesDeclarationFile);
};

const generateLinkFunction = async (appDir: string, utilsPath: string) => {
  const linkFunctionFile = await getLinkFunction(appDir);
  await writeFile(utilsPath, linkFunctionFile);
};

export { generateDeclarations, generateLinkFunction };
