#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('');
console.log('  ╔════════════════════════════════════════════════════╗');
console.log('  ║                                                    ║');
console.log('  ║                🚀  node2exe  🚀                    ║');
console.log('  ║          Convert Node.js to Executable             ║');
console.log('  ║          (SEA - Single Executable App)             ║');
console.log('  ║                                                    ║');
console.log('  ╚════════════════════════════════════════════════════╝');
console.log('');

const projectDir = process.cwd();
const platform = os.platform();
const args = process.argv.slice(2);
const includeVersion = args.includes('-V') || args.includes('--version');
const skipBundle = args.includes('--no-bundle');

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

// Check if bundling is needed
let finalEntryFile = entryFile;
if (!skipBundle) {
    console.log('[0/6] Checking for node_modules...');
    const nodeModulesPath = path.join(projectDir, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
        console.log('✓ node_modules found - will bundle dependencies\n');
        
        console.log('[1/6] Bundling with esbuild...');
        const bundledFile = path.join(projectDir, '.node2exe-bundle.js');
        try {
            require.resolve('esbuild');
        } catch (e) {
            console.log('Installing esbuild...');
            try {
                execSync('npm install --save-dev esbuild', { cwd: projectDir, stdio: 'inherit' });
            } catch (err) {
                console.log('❌ Error: esbuild installation failed');
                process.exit(1);
            }
        }
        
        try {
            execSync(`npx esbuild ${entryFile} --bundle --platform=node --outfile=${bundledFile}`, {
                cwd: projectDir,
                stdio: 'inherit'
            });
            console.log('✓ Bundling complete\n');
            finalEntryFile = '.node2exe-bundle.js';
        } catch (err) {
            console.log('❌ Error: Bundling failed');
            process.exit(1);
        }
    } else {
        console.log('✓ No node_modules - skipping bundling\n');
    }
}

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
        main: finalEntryFile,
        output: 'sea-prep.blob',
        disableExperimentalSEAWarning: true
    };
    fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
} else {
    // Update sea-config.json with the final entry file
    const seaConfig = JSON.parse(fs.readFileSync(seaConfigPath, 'utf8'));
    seaConfig.main = finalEntryFile;
    fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
}
console.log('✓ sea-config.json present\n');

// Determine output filename based on main entry file name
let baseName = path.basename(entryFile, path.extname(entryFile));
let exeName = platform === 'win32' ? `${baseName}.exe` : baseName;
if (includeVersion && packageJson.version) {
    const version = packageJson.version;
    exeName = platform === 'win32' 
        ? `${baseName}-${version}.exe` 
        : `${baseName}-${version}`;
}
const outputPath = path.join(projectDir, exeName);

const stepOffset = skipBundle ? 1 : 2;

// Step 1/2: Generate SEA blob
console.log(`[${2}/6] Generating SEA blob...`);
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

// Step 2/3: Copy Node binary
console.log(`[${3}/6] Copying Node.js binary...`);
try {
    const nodePath = process.execPath;
    fs.copyFileSync(nodePath, outputPath);
    console.log(`✓ ${exeName} created\n`);
} catch (err) {
    console.log('❌ Error: Copy failed');
    console.log(err.message);
    process.exit(1);
}

// Step 3/4: Remove signature (macOS only)
if (platform === 'darwin') {
    console.log(`[${4}/6] Removing signature (macOS)...`);
    try {
        execSync(`codesign --remove-signature ${exeName}`, { cwd: projectDir });
        console.log('✓ Signature removed\n');
    } catch (err) {
        console.log('⚠ Warning: Could not remove signature');
        console.log('  (continuing anyway)\n');
    }
} else {
    console.log(`[${4}/6] Signature step: Not applicable\n`);
}

// Step 4/5: Inject blob with postject
console.log(`[${5}/6] Injecting SEA blob...`);
console.log('⏳ This may take 30-60 seconds, please wait...\n');
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

// Step 5/6: Sign (macOS only) or cleanup
if (platform === 'darwin') {
    console.log(`[${6}/6] Signing binary (macOS)...`);
    try {
        execSync(`codesign --sign - ${exeName}`, { cwd: projectDir });
        console.log('✓ Binary signed\n');
    } catch (err) {
        console.log('⚠ Warning: Signing failed');
        console.log('  (binary can still run)\n');
    }
} else {
    console.log(`[${6}/6] Cleanup...`);
    try {
        const blobPath = path.join(projectDir, 'sea-prep.blob');
        if (fs.existsSync(blobPath)) {
            fs.unlinkSync(blobPath);
        }
        const bundlePath = path.join(projectDir, '.node2exe-bundle.js');
        if (fs.existsSync(bundlePath)) {
            fs.unlinkSync(bundlePath);
        }
        console.log('✓ Cleanup done\n');
    } catch (err) {
        console.log('⚠ Warning: Partial cleanup');
    }
}

// Success
console.log('');
console.log('  ╔════════════════════════════════════════════════════╗');
console.log('  ║                                                    ║');
console.log('  ║              ✅  Success!  ✅                      ║');
console.log('  ║                                                    ║');
console.log('  ╚════════════════════════════════════════════════════╝');
console.log('');
console.log(`  📁  File created: ${exeName}`);
console.log('  📦  package.json updated with postject');

if (platform === 'win32') {
    console.log(`  🚀  Run: ${exeName}`);
} else {
    console.log(`  🚀  Run: ./${exeName}`);
}

console.log('');
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('  💡 Notes:');
console.log('     • Distribute the executable without Node.js');
console.log('     • sea-config.json not needed for execution');
console.log('     • Typical size: 60-80 MB');
console.log('     • Use -V flag for versioned filename');
console.log('     • Use --no-bundle to skip dependency bundling');
console.log('');
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');