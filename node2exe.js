#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('========================================');
console.log('   Conversion Node.js en Executable');
console.log('   (SEA - Single Executable Application)');
console.log('========================================\n');

const projectDir = process.cwd();
const platform = os.platform();

// Vérifier que c'est Windows, Mac ou Linux
if (!['win32', 'darwin', 'linux'].includes(platform)) {
    console.log('❌ Erreur : plateforme non supportée');
    console.log(`   Plateforme détectée : ${platform}`);
    console.log('   Supportée : Windows, macOS, Linux');
    process.exit(1);
}

console.log(`ℹ Plateforme détectée : ${platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux'}\n`);

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

// Déterminer le nom du fichier de sortie
const exeName = platform === 'win32' ? 'app.exe' : 'app';
const outputPath = path.join(projectDir, exeName);

// Étape 1 : Générer le blob SEA
console.log('[1/5] Génération du blob SEA...');
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

// Étape 2 : Copier Node
console.log(`[2/5] Copie du binaire Node.js...`);
try {
    const nodePath = process.execPath;
    fs.copyFileSync(nodePath, outputPath);
    console.log(`✓ ${exeName} créé\n`);
} catch (err) {
    console.log('❌ Erreur : copie échouée');
    console.log(err.message);
    process.exit(1);
}

// Étape 3 : Retirer la signature (macOS uniquement)
if (platform === 'darwin') {
    console.log('[3/5] Retrait de la signature (macOS)...');
    try {
        execSync(`codesign --remove-signature ${exeName}`, { cwd: projectDir });
        console.log('✓ Signature retirée\n');
    } catch (err) {
        console.log('⚠ Avertissement : impossible de retirer la signature');
        console.log('  (continuons quand même)\n');
    }
} else {
    console.log('[3/5] Étape signature : non applicable\n');
}

// Étape 4 : Injecter le blob avec postject
console.log('[4/5] Injection du blob SEA...');
try {
    let injectCmd;
    if (platform === 'win32') {
        injectCmd = `npx postject ${exeName} NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
    } else if (platform === 'darwin') {
        injectCmd = `npx postject ${exeName} NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`;
    } else {
        injectCmd = `npx postject ${exeName} NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
    }
    
    execSync(injectCmd, { cwd: projectDir, stdio: 'inherit' });
    console.log('✓ Blob injecté avec succès\n');
} catch (err) {
    console.log('❌ Erreur : injection échouée');
    process.exit(1);
}

// Étape 5 : Signer (macOS uniquement)
if (platform === 'darwin') {
    console.log('[5/5] Signature du binaire (macOS)...');
    try {
        execSync(`codesign --sign - ${exeName}`, { cwd: projectDir });
        console.log('✓ Binaire signé\n');
    } catch (err) {
        console.log('⚠ Avertissement : signature échouée');
        console.log('  (le binaire peut quand même fonctionner)\n');
    }
} else {
    console.log('[5/5] Nettoyage...');
    try {
        const blobPath = path.join(projectDir, 'sea-prep.blob');
        if (fs.existsSync(blobPath)) {
            fs.unlinkSync(blobPath);
        }
        console.log('✓ Nettoyage fait\n');
    } catch (err) {
        console.log('⚠ Avertissement : nettoyage partiel');
    }
}

// Succès
console.log('========================================');
console.log('   ✅ Succès !');
console.log('========================================\n');
console.log(`📁 Fichier créé : ${exeName}`);
console.log('📦 package.json mis à jour avec postject');

if (platform === 'win32') {
    console.log('🚀 Double-cliquez sur app.exe pour l\'exécuter\n');
} else {
    console.log(`🚀 Lancez : ./${exeName}\n`);
}

console.log('Notes:');
console.log('- Vous pouvez maintenant distribuer le fichier sans Node.js');
console.log('- Les fichiers sea-config.json ne sont pas nécessaires pour l\'exécution');
console.log('- Taille typique : 60-80 MB selon votre app');