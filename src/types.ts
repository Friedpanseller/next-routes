type FSTreeWalker = {
  base: string;
  paths: FSTreeWalker[];
};

type Route<
  T extends string = string,
  P extends { [key: string]: string | string[] } = {
    [key: string]: string | string[];
  },
> = {
  path: T;
  params: P;
  isDynamic: boolean;
  isCatchAll: boolean;
  isOptionalCatchAll: boolean;
};

type NextRoutesOptions = {
  appDir: string;
  declarationPath: string;
  utilsPath: string;
};

export type { FSTreeWalker, Route, NextRoutesOptions };
