const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.resolver.assetExts.push('wasm');

// Watch the full monorepo so Metro can resolve workspace packages.
config.watchFolders = [workspaceRoot];

// Prefer workspace package resolution order: app first, then root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force a single React instance across the monorepo.
// extraNodeModules is a fallback and loses to the standard node_modules walk, so
// react-native (at workspace root) would still resolve React 19.2.7 while app
// code resolves 19.1.0. resolveRequest intercepts before any walk, guaranteeing
// all code in the bundle uses the same React copy.
const REACT_PATH = path.resolve(projectRoot, 'node_modules/react');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return { filePath: path.join(REACT_PATH, 'index.js'), type: 'sourceFile' };
  }
  if (moduleName === 'react/jsx-runtime') {
    return { filePath: path.join(REACT_PATH, 'jsx-runtime.js'), type: 'sourceFile' };
  }
  if (moduleName === 'react/jsx-dev-runtime') {
    return { filePath: path.join(REACT_PATH, 'jsx-dev-runtime.js'), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
