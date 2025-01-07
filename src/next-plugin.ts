import chalk from 'chalk';
import { watch } from 'chokidar';
import fs from 'fs';
import {
  NextJsWebpackConfig,
  WebpackConfigContext,
} from 'next/dist/server/config-shared';
import type { WebpackPluginInstance } from 'webpack';
import { TYPES_DIR } from './config';
import { NextRoutesOptions } from './types';
import { generateDeclarations, generateLinkFunction } from './codegen';

const createDirectoryIfNotExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    console.log(chalk.greenBright(`📦 Creating ${dir}...`));
    fs.mkdirSync(dir);
  }
};

const getDirectoryFromPath = (filePath: string) =>
  filePath.split('/').slice(0, -1).join('/');

export default class NextRoutesPlugin implements WebpackPluginInstance {
  name = 'NextRoutesPlugin';
  private changedFiles = new Set<string>();
  private regenerateTimeout?: NodeJS.Timeout;

  constructor(
    private config: NextJsWebpackConfig,
    private readonly options: WebpackConfigContext,
    private nextRoutesOptions: NextRoutesOptions,
  ) {}

  async generateRoutes() {
    const { appDir, declarationPath, utilsPath } = this.nextRoutesOptions;
    console.log(chalk.cyanBright(`🚀 Generating routes...`));
    createDirectoryIfNotExists(TYPES_DIR);
    createDirectoryIfNotExists(getDirectoryFromPath(utilsPath));
    await this.emitDeclarationFile(appDir, declarationPath);
    await generateLinkFunction(appDir, utilsPath);
    this.watchForChanges(appDir, declarationPath, utilsPath);
  }

  async emitDeclarationFile(appDir: string, declarationPath: string) {
    console.log(chalk.cyanBright(`📦 Emitting declaration file...`));
    await generateDeclarations(appDir, declarationPath);
    console.log(chalk.greenBright(`📦 Declaration file emitted!`));
  }

  watchForChanges(appDir: string, declarationPath: string, utilsPath: string) {
    if (process.env.NODE_ENV === 'development') {
      const watcher = watch(appDir, {
        ignored: [/node_modules/, /(^|[/\\])\../, /(^|[/\\])_/],
        persistent: true,
      });
      watcher.on('ready', () => {
        console.log(chalk.cyanBright(`👀 Watching the app directory...`));
      });
      watcher.on('all', (event, path) => {
        if (event === 'add' || event === 'unlink') {
          this.scheduleRegenerateRoutes(
            path,
            appDir,
            declarationPath,
            utilsPath,
          );
        }
      });
      this.setupExitHandlers(watcher as unknown as fs.FSWatcher);
    }
  }
  scheduleRegenerateRoutes(
    path: string,
    appDir: string,
    declarationPath: string,
    utilsPath: string,
  ) {
    this.changedFiles.add(path);
    clearTimeout(this.regenerateTimeout);
    this.regenerateTimeout = setTimeout(() => {
      this.regenerateRoutes(appDir, declarationPath, utilsPath);
    }, 300);
  }

  async regenerateRoutes(
    appDir: string,
    declarationPath: string,
    utilsPath: string,
  ) {
    console.log(
      chalk.cyanBright(
        `🚀 Regenerating routes for ${this.changedFiles.size} changed files...`,
      ),
    );
    await this.emitDeclarationFile(appDir, declarationPath);
    await generateLinkFunction(appDir, utilsPath);
    this.changedFiles.clear();
  }

  setupExitHandlers(watcher: fs.FSWatcher) {
    const closeWatcherAndExit = () => {
      watcher.close();
      process.exit();
    };
    process.on('SIGINT', closeWatcherAndExit);
    process.on('SIGTERM', closeWatcherAndExit);
    process.on('exit', () => {
      watcher.close();
    });
  }

  apply() {
    this.generateRoutes().then(() => {
      console.log(chalk.greenBright(`🚀 Routes generated!`));
    });
  }
}
