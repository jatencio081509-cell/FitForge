const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the full workspace and resolve packages from both locations
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Block postinstall temp directories that @expo/vector-icons (and other packages)
// create and delete during `pnpm install`.  Metro's FallbackWatcher picks them up
// during its initial crawl; by the time it calls fs.watch() the dirs are gone,
// producing an ENOENT crash.  Adding them to blockList prevents the crawler from
// descending into those paths at all.
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  // Block postinstall temp dirs (e.g. @expo/vector-icons during pnpm install)
  /node_modules[/\\].*_tmp_\d+[/\\]/,
  // Block Replit internal skill/agent directories — they contain stale paths
  // that Metro's FallbackWatcher tries to watch and crashes with ENOENT
  /[/\\]\.local[/\\]/,
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
    ? [existingBlockList]
    : []),
];

module.exports = config;
