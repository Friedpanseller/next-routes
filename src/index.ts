import { NextConfig } from 'next';
import { defaultNextRoutesOptions } from './config';
import NextRoutesPlugin from './next-plugin';
import { NextRoutesOptions } from './types';

const withNextRoutes = (
  nextConfig: NextConfig,
  nextRoutesOptions?: Partial<NextRoutesOptions>,
): NextConfig => {
  return {
    ...nextConfig,
    webpack: (config, options) => {
      const mergedOptions = {
        ...defaultNextRoutesOptions,
        ...nextRoutesOptions,
      };

      if (options.isServer) {
        config.plugins = config.plugins || [];
        config.plugins.push(
          new NextRoutesPlugin(config, options, mergedOptions),
        );
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    },
  };
};

export default withNextRoutes;
