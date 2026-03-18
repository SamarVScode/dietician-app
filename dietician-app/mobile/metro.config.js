const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so Metro can resolve packages hoisted there
config.watchFolders = [monorepoRoot];

// Resolve from mobile's node_modules first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force react and react-native (including subpath imports like react/jsx-runtime)
// to always resolve from mobile's node_modules.
// Root node_modules has React 19 (dashboard) vs mobile's React 18,
// causing "invalid hook call" / "useState of null" errors without this override.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName.startsWith('react/') ||
    moduleName === 'react-native' ||
    moduleName.startsWith('react-native/')
  ) {
    const resolved = require.resolve(moduleName, { paths: [projectRoot] });
    return { filePath: resolved, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
