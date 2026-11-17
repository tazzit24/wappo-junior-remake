const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = process.env.DIST_DIR
  ? path.resolve(ROOT_DIR, process.env.DIST_DIR)
  : path.join(ROOT_DIR, 'dist');

const INCLUDED_ITEMS = [
  'assets',
  'lib',
  'src',
  'favicon.ico',
  'index.html',
  'manifest.json',
  'sw.js'
];

function isPathInside(parent, candidate) {
  const relativePath = path.relative(parent, candidate);
  return relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath);
}

function getIncludedPaths() {
  const seenItems = new Set();

  return INCLUDED_ITEMS.map((item) => {
    if (path.isAbsolute(item) || item.split(/[\\/]/).includes('..')) {
      throw new Error(`Invalid inclusion path: ${item}`);
    }
    if (seenItems.has(item)) {
      throw new Error(`Duplicate inclusion path: ${item}`);
    }
    seenItems.add(item);

    const sourcePath = path.resolve(ROOT_DIR, item);
    if (!isPathInside(ROOT_DIR, sourcePath) || isPathInside(DIST_DIR, sourcePath)) {
      throw new Error(`Inclusion path is outside the project or targets dist: ${item}`);
    }

    let stats;
    try {
      stats = fs.lstatSync(sourcePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Included item not found: ${item}`);
      }
      throw error;
    }

    if (!stats.isFile() && !stats.isDirectory()) {
      throw new Error(`Unsupported item type: ${item}`);
    }

    return { item, sourcePath };
  });
}

function copyRecursive(sourcePath, destinationPath) {
  const stats = fs.lstatSync(sourcePath);

  if (stats.isSymbolicLink()) {
    throw new Error(`Symbolic links are not supported: ${sourcePath}`);
  }
  if (stats.isFile()) {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
    return 1;
  }
  if (!stats.isDirectory()) {
    throw new Error(`Unsupported file type: ${sourcePath}`);
  }

  fs.mkdirSync(destinationPath, { recursive: true });
  const entries = fs.readdirSync(sourcePath, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));

  let count = 0;
  for (const entry of entries) {
    const childSourcePath = path.join(sourcePath, entry.name);
    const childDestinationPath = path.join(destinationPath, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported: ${childSourcePath}`);
    }
    count += copyRecursive(childSourcePath, childDestinationPath);
  }
  return count;
}

function runBuild() {
  console.log('🚀 Starting build...');
  console.log(`📁 Source directory: ${ROOT_DIR}`);
  console.log(`📁 Output directory: ${DIST_DIR}`);

  const includedPaths = getIncludedPaths();
  const startTime = Date.now();

  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Cleaning up the previous build directory...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  let copiedFiles = 0;
  for (const { item, sourcePath } of includedPaths) {
    copiedFiles += copyRecursive(sourcePath, path.join(DIST_DIR, item));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('✨ Build completed successfully!');
  console.log(`📦 ${copiedFiles} files copied to "${DIST_DIR}" in ${duration}s.`);
}

runBuild();