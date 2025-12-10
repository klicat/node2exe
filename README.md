# node2exe

🚀 Easily convert your Node.js application into an executable with SEA (Single Executable Application).

**Supported on:** Windows, macOS, Linux

Made with ❤️ by [Klicat](https://klicat.com) - France

---

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
- A file specified in `package.json` `main` field (e.g., `server.js`, `app.js`, `index.js`)
- A `package.json` file

**Note:** The executable name is based on the `main` field filename. If not defined, it defaults to `app`.

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

**However, with node2exe's automatic bundling, you can write in ES Modules!** Here's how:

### How it works:

1. **You write ES Modules:**
```javascript
import colors from 'colors';
import https from 'https';

console.log('Hello'.blue);
```

2. **esbuild automatically converts to CommonJS:**
```javascript
const colors = require('colors');
const https = require('https');

console.log('Hello'.blue);
```

3. **SEA runs the CommonJS version in the executable**

### ✅ Using ES Modules (Recommended for new projects)

**Don't forget to add `"type": "module"` to package.json:**

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js"
}
```

**Your code:**
```javascript
import express from 'express';
import colors from 'colors';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  console.log(colors.blue('→ Request received on /'));
  res.send('Hello World from Express!');
});

app.listen(PORT, () => {
  console.log(colors.green(`✓ Server running on http://localhost:${PORT}`));
});
```

### ✅ Using CommonJS (Traditional)

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "main": "server.js"
}
```

**Your code:**
```javascript
const express = require('express');
const colors = require('colors');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  console.log(colors.blue('→ Request received on /'));
  res.send('Hello World from Express!');
});

app.listen(PORT, () => {
  console.log(colors.green(`✓ Server running on http://localhost:${PORT}`));
});
```

### ⚠️ Limitations with ES Modules

Some advanced ES Module features may not work:
- **Dynamic imports** - `import()` at runtime
- **Top-level await** - `await` outside async function
- **Circular dependencies** - complex import cycles

**Simple rule:** If your imports look straightforward, they'll work!

**Official documentation:** https://nodejs.org/api/single-executable-applications.html

> "The single executable application feature currently only supports running a single embedded script using the CommonJS module system."

## Executable Naming

The name of your executable is automatically determined by the `main` field in your `package.json`:

### Example 1: With `main` defined
```json
{
  "name": "my-project",
  "main": "server.js",
  "version": "1.0.0"
}
```
Running `npx node2exe` creates: **`server.exe`** (or `server` on macOS/Linux)

### Example 2: Default behavior
```json
{
  "name": "my-project",
  "version": "1.0.0"
}
```
Running `npx node2exe` creates: **`app.exe`** (default name, since `main` is not defined)

### Example 3: With version flag
```json
{
  "name": "my-project",
  "main": "index.js",
  "version": "2.5.0"
}
```
Running `npx node2exe -V` creates: **`index-2.5.0.exe`**

### How it works:
- node2exe reads the `main` field from `package.json`
- Extracts the filename without extension: `server.js` → `server`
- Uses that as the executable name
- If `main` is not defined, defaults to `app`
- With `-V` flag, appends the version: `server-1.0.0.exe`

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

## Automatic Bundling with Dependencies

When you have npm packages in your `node_modules`, node2exe automatically bundles them into the executable using esbuild. This works great for most packages!

```bash
npm install colors
npx node2exe
# This automatically bundles 'colors' into the executable
```

### ⚠️ Important: Assets and Data Files

Some npm packages require external data files (like databases or configuration files). These **cannot be automatically bundled** into the executable because:

1. **SEA doesn't support file system access** for bundled assets by default
2. **Data files are not code** - esbuild bundler only handles JavaScript
3. **Path resolution fails** - packages looking for files on disk won't find them in the executable

**Examples of packages with data files:**
- `geoip-lite` - requires `.dat` files
- SQLite databases - `.db` files  
- Font files, images, config files

**Solutions:**
1. **Use online APIs instead** - Replace local data with API calls (recommended) ✅
   ```javascript
   // Instead of: const geoip = require('geoip-lite');
   // Use: fetch('https://ip-api.com/json/' + ip)
   ```

2. **Use web services** - Move data-heavy operations to cloud services

3. **Manually add assets** - Edit `sea-config.json` to include assets (advanced, complex)