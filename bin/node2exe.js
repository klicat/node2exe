#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('========================================');
console.log('   Node.js to Executable Converter');
console.log('   (SEA - Single Executable Application)');
console.log('========================================\n');

const projectDir = process.cwd();
const platform = os.platform();
const args = process.argv.slice(2);
const includeVersion = args.includes('-V') || args.includes('--version');

// Check platform support
if (!['win32', 'darwin', 'linux'].includes(platform)) {
    console.log('❌ Error: Unsupported platform');
    console.log(`   Detected platform: ${platform}`);
    console.log('   Supported: Windows, macOS, Linux');
    process.exit(1);
}

console.log(`ℹ Detected platform: ${platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux'}\n`);

// Check package.json
const packageJsonPath = path.join(projectDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ Error: package.json not found');
    process.exit(1);
}

let packageJson;
try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (err) {
    console.log('❌ Error: Invalid package.json');
    process.exit(1);
}

console.log('✓ package.json found');

// Get entry file from package.json main field
let entryFile = packageJson.main || 'index.js';
if (!fs.existsSync(path.join(projectDir, entryFile))) {
    console.log(`❌ Error: Main entry file "${entryFile}" not found`);
    process.exit(1);
}
console.log(`✓ Entry file found: ${entryFile}\n`);

// Check/install postject
console.log('Checking postject...');
try {
    require.resolve('postject');
    console.log('✓ postject present\n');
} catch (e) {
    console.log('Installing postject...');
    try {
        execSync('npm install --save-dev postject', { cwd: projectDir, stdio: 'inherit' });
        console.log('✓ postject installed\n');
    } catch (err) {
        console.log('❌ Error: postject installation failed');
        process.exit(1);
    }
}

// Create sea-config.json
const seaConfigPath = path.join(projectDir, 'sea-config.json');
if (!fs.existsSync(seaConfigPath)) {
    console.log('Creating sea-config.json...');
    const seaConfig = {
        main: entryFile,
        output: 'sea-prep.blob',
        disableExperimentalSEAWarning: true
    };
    fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
}
console.log('✓ sea-config.json present\n');

// Determine output filename
let exeName = platform === 'win32' ? 'app.exe' : 'app';
if (includeVersion && packageJson.version) {
    const version = packageJson.version;
    exeName = platform === 'win32' 
        ? `app-${version}.exe` 
        : `app-${version}`;
}
const outputPath = path.join(projectDir, exeName);

// Step 1: Generate SEA blob
console.log('[1/5] Generating SEA blob...');
try {
    execSync(`node --experimental-sea-config sea-config.json`, { 
        cwd: projectDir,
        stdio: 'inherit'
    });
    console.log('✓ SEA blob generated: sea-prep.blob\n');
} catch (err) {
    console.log('❌ Error: Failed to generate blob');
    process.exit(1);
}

// Step 2: Copy Node binary
console.log(`[2/5] Copying Node.js binary...`);
try {
    const nodePath = process.execPath;
    fs.copyFileSync(nodePath, outputPath);
    console.log(`✓ ${exeName} created\n`);
} catch (err) {
    console.log('❌ Error: Copy failed');
    console.log(err.message);
    process.exit(1);
}

// Step 3: Remove signature (macOS only)
if (platform === 'darwin') {
    console.log('[3/5] Removing signature (macOS)...');
    try {
        execSync(`codesign --remove-signature ${exeName}`, { cwd: projectDir });
        console.log('✓ Signature removed\n');
    } catch (err) {
        console.log('⚠ Warning: Could not remove signature');
        console.log('  (continuing anyway)\n');
    }
} else {
    console.log('[3/5] Signature step: Not applicable\n');
}

// Step 4: Inject blob with postject
console.log('[4/5] Injecting SEA blob...');
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
    console.log('✓ Blob injected successfully\n');
} catch (err) {
    console.log('❌ Error: Injection failed');
    process.exit(1);
}

// Step 5: Sign (macOS only) or cleanup
if (platform === 'darwin') {
    console.log('[5/5] Signing binary (macOS)...');
    try {
        execSync(`codesign --sign - ${exeName}`, { cwd: projectDir });
        console.log('✓ Binary signed\n');
    } catch (err) {
        console.log('⚠ Warning: Signing failed');
        console.log('  (binary can still run)\n');
    }
} else {
    console.log('[5/5] Cleanup...');
    try {
        const blobPath = path.join(projectDir, 'sea-prep.blob');
        if (fs.existsSync(blobPath)) {
            fs.unlinkSync(blobPath);
        }
        console.log('✓ Cleanup done\n');
    } catch (err) {
        console.log('⚠ Warning: Partial cleanup');
    }
}

// Success
console.log('========================================');
console.log('   ✅ Success!');
console.log('========================================\n');
console.log(`📁 File created: ${exeName}`);
console.log('📦 package.json updated with postject');

if (platform === 'win32') {
    console.log('🚀 Double-click app.exe to run\n');
} else {
    console.log(`🚀 Run: ./${exeName}\n`);
}

console.log('Notes:');
console.log('- You can now distribute the executable without Node.js');
console.log('- sea-config.json file is not needed for execution');
console.log('- Typical size: 60-80 MB depending on your app');
console.log('- Use -V flag to include version in filename: node2exe -V');