#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================');
console.log('   Conversion Node.js en Executable');
console.log('   pour Windows (SEA)');
console.log('========================================\n');

const projectDir = process.cwd();

// Déterminer le fichier d'entrée
let entryFile;
if (fs.existsSync(path.join(projectDir, 'app.js'))) {
    entryFile = 'app.js';
    console.log('✓ app.js trouvé');
} else if (fs.existsSync(path.join(projectDir, 'index.js'))) {
    entryFile = 'index.js';
    console.log('✓ index.js trouvé');
} else {
    console.log('❌ Erreur : app.js ou index.js introuvable');
    process.exit(1);
}

// Vérifier package.json
if (!fs.existsSync(path.join(projectDir, 'package.json'))) {
    console.log('❌ Erreur : package.json introuvable');
    process.exit(1);
}
console.log('✓ package.json trouvé\n');

// Vérifier/installer postject
console.log('Vérification de postject...');
try {
    require.resolve('postject');
    console.log('✓ postject présent\n');
} catch (e) {
    console.log('Installation de postject...');
    try {
        execSync('npm install --save-dev postject', { cwd: projectDir, stdio: 'inherit' });
        console.log('✓ postject installé\n');
    } catch (err) {
        console.log('❌ Erreur : postject non installé');
        process.exit(1);
    }
}

// Créer sea-config.json
const seaConfigPath = path.join(projectDir, 'sea-config.json');
if (!fs.existsSync(seaConfigPath)) {
    console.log('Création de sea-config.json...');
    const seaConfig = {
        main: entryFile,
        output: 'sea-prep.blob',
        disableExperimentalSEAWarning: true
    };
    fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
}
console.log('✓ sea-config.json présent\n');

// Étape 1 : Générer le blob SEA
console.log('[1/4] Génération du blob SEA...');
try {
    execSync(`node --experimental-sea-config sea-config.json`, { 
        cwd: projectDir,
        stdio: 'inherit'
    });
    console.log('✓ Blob SEA généré : sea-prep.blob\n');
} catch (err) {
    console.log('❌ Erreur : blob non généré');
    process.exit(1);
}

// Étape 2 : Copier Node.exe en app.exe
console.log('[2/4] Copie du binaire Node.js...');
try {
    const nodePath = process.execPath;
    const appExePath = path.join(projectDir, 'app.exe');
    fs.copyFileSync(nodePath, appExePath);
    console.log('✓ app.exe créé\n');
} catch (err) {
    console.log('❌ Erreur : copie échouée');
    console.log(err.message);
    process.exit(1);
}

// Étape 3 : Injecter le blob avec postject
console.log('[3/4] Injection du blob SEA...');
try {
    execSync(
        `npx postject app.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
        { cwd: projectDir, stdio: 'inherit' }
    );
    console.log('✓ Blob injecté avec succès\n');
} catch (err) {
    console.log('❌ Erreur : injection échouée');
    process.exit(1);
}

// Étape 4 : Nettoyage
console.log('[4/4] Nettoyage...');
try {
    const blobPath = path.join(projectDir, 'sea-prep.blob');
    if (fs.existsSync(blobPath)) {
        fs.unlinkSync(blobPath);
    }
    console.log('✓ Nettoyage fait\n');
} catch (err) {
    console.log('⚠ Avertissement : nettoyage partiel');
}

// Succès
console.log('========================================');
console.log('   ✅ Succès !');
console.log('========================================\n');
console.log('📁 Fichier créé : app.exe');
console.log('📦 package.json mis à jour avec postject');
console.log('🚀 Double-cliquez sur app.exe pour l\'exécuter\n');
console.log('Notes:');
console.log('- Vous pouvez maintenant distribuer app.exe sans Node.js');
console.log('- Les fichiers sea-config.json ne sont pas nécessaires pour l\'exécution');