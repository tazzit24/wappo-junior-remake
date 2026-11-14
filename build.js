const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = 'D:/Builds/Guappo_Junior/';

fs.mkdirSync(DIST_DIR, { recursive: true });

// Liste des fichiers et dossiers explicitement exclus
const EXCLUDED_NAMES = new Set([
  'dist',
  'build.js',
  'defs',
  'docs',
  'node_modules',
  'cert.pem',
  'jsconfig.json',
  'key.pem',
  'package.json',
  'server.js',
  'test-events.js'
]);

/**
 * Vérifie si un fichier ou dossier doit être ignoré.
 * @param {string} name - Nom du fichier ou dossier
 * @returns {boolean}
 */
function shouldExclude(name) {
  // Exclure tous les fichiers/dossiers commençant par un point (ex: .git, .vscode, .gitignore, etc.)
  if (name.startsWith('.')) {
    return true;
  }
  // Exclure les éléments spécifiés dans la liste
  if (EXCLUDED_NAMES.has(name)) {
    return true;
  }
  return false;
}

/**
 * Copie récursivement un dossier vers une destination en appliquant les exclusions.
 * @param {string} src - Chemin source
 * @param {string} dest - Chemin de destination
 * @returns {number} Nombre de fichiers copiés
 */
function copyRecursive(src, dest) {
  let count = 0;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldExclude(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function runBuild() {
  console.log('🚀 Démarrage du build...');
  console.log(`📁 Dossier source : ${ROOT_DIR}`);
  console.log(`📁 Dossier cible  : ${DIST_DIR}`);

  const startTime = Date.now();

  // Nettoyage préalable du dossier dist s'il existe déjà
  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Nettoyage de l\'ancien dossier "dist"...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(DIST_DIR, { recursive: true });

  const copiedFiles = copyRecursive(ROOT_DIR, DIST_DIR);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✨ Build terminé avec succès !`);
  console.log(`📦 ${copiedFiles} fichiers copiés dans "dist" en ${duration}s.`);
}

runBuild();
