# node2exe

🚀 Easily convert your Node.js application into an executable with SEA (Single Executable Application).

**Supported on:** Windows, macOS, Linux

## Installation

```bash
npm install --save-dev node2exe
```

## Usage

### Option 1: Direct command
In your project, run:
```bash
npx node2exe
```

### Option 2: With version in filename
```bash
npx node2exe -V
```
This generates `app-1.0.0.exe` (or `app-1.0.0` on macOS/Linux) based on your package.json version.

### Option 3: NPM script
Add to your `package.json`:
```json
{
  "scripts": {
    "build:exe": "node2exe"
  }
}
```

Then run:
```bash
npm run build:exe
npm run build:exe -- -V  # with version
```

## Requirements

- **Node.js 24+** (with SEA support)
- An `app.js`, `index.js`, or file specified in `package.json` `main` field
- A `package.json` file

## Output by platform

### Windows
- Generates: `app.exe` (Windows executable)
- Run: Double-click or `app.exe`

### macOS
- Generates: `app` (macOS executable)
- Run: `./app` in terminal
- Note: Automatic code signing

### Linux
- Generates: `app` (Linux executable)
- Run: `./app` in terminal

## How it works

1. ✅ Reads entry point from `package.json` `main` field
2. ✅ Installs `postject` if not already present
3. ✅ Creates `sea-config.json` automatically
4. ✅ Generates the SEA blob
5. ✅ Creates the executable for your platform
6. ✅ Cleans up temporary files

## Example

```bash
# Installation
npm install --save-dev node2exe

# Usage
npx node2exe

# Result
# ✅ app.exe created! (Windows)
# ✅ app created! (macOS/Linux)
```

## Generated files

- `app.exe` / `app` - Your final executable (ready to distribute)
- `sea-config.json` - SEA configuration (optional after creation)
- `node_modules/` - Contains postject and dependencies

## Important: CommonJS (require) vs ES Modules (import)

⚠️ **SEA (Single Executable Applications) only supports CommonJS modules** (`require`), not ES Modules (`import`).

**Official documentation:** https://nodejs.org/api/single-executable-applications.html

> "The single executable application feature currently only supports running a single embedded script using the CommonJS module system."

### ✅ Works (CommonJS)
```javascript
const express = require('express');
const fs = require('fs');

app.get('/', (req, res) => {
  res.send('Hello World');
});
```

### ❌ Does NOT work (ES Modules)
```javascript
import express from 'express';  // ❌ Not supported
import fs from 'fs';             // ❌ Not supported
```

### Why?
Node.js SEA currently only supports the CommonJS module system. ES Module support (`import/export`) is not yet available in SEA due to technical limitations.

### Solution
If your project uses ES Modules, you need to:
1. Convert your code to CommonJS (`require`)
2. Or use a bundler like `esbuild` to bundle your ES Modules into a single CommonJS file before building the executable

Example with esbuild:
```bash
npx esbuild app.js --bundle --platform=node --outfile=bundle.js
# Then update package.json main to "bundle.js"
npx node2exe
```

## Notes

- The created executable includes all your code and Node.js
- No external dependencies required to run
- Typical size: 60-80 MB depending on your app
- The script is written in pure JavaScript (cross-platform)
- Each platform generates its own executable
- Use the `-V` flag to include version in the filename

## Windows: "The signature seems corrupted" warning

When building on Windows, you may see this warning during the injection step:

```
warning: The signature seems corrupted!
```

**This is completely normal and harmless!** 

Here's why it happens:
- Windows signs all `.exe` files with a digital signature for security
- When `postject` injects the SEA blob, it modifies the binary structure
- This breaks the original Windows signature (but the file still works perfectly)
- The warning is just informational and can be safely ignored

**The executable will work perfectly fine without the signature.** If you want to sign it with a code signing certificate, you can use `signtool` from the Windows SDK (requires a valid certificate).

## Injection takes 30-60 seconds

⏳ **Important:** The injection step (step 4/5) can take **30-60 seconds** depending on your disk speed.

This is because `postject` needs to:
- Read the entire Node.js binary (50-80 MB)
- Inject the SEA blob into it
- Write the complete file back to disk

**This is normal and expected.** Just wait for the process to complete. Do not interrupt it during this step!
