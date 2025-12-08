\# node2exe

🚀 Easily convert your Node.js application into an executable with SEA (Single Executable Application).

\*\*Supported on:\*\* Windows, macOS, Linux

\## Installation

```bash

npm install --save-dev node2exe

```

\## Usage

\### Option 1: Direct command

In your project, run:

```bash

npx node2exe

```

\### Option 2: NPM script

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

```

\## Requirements

\- \*\*Node.js 24+\*\* (with SEA support)

\- An `app.js` or `index.js` file in your project

\- A `package.json` file

\## Output by platform

\### Windows

\- Generates: `app.exe` (Windows executable)

\- Run: Double-click or `app.exe`

\### macOS

\- Generates: `app` (macOS executable)

\- Run: `./app` in terminal

\- Note: Automatic code signing

\### Linux

\- Generates: `app` (Linux executable)

\- Run: `./app` in terminal

\## How it works

1\. ✅ Automatically detects `app.js` or `index.js`

2\. ✅ Installs `postject` if not already present

3\. ✅ Creates `sea-config.json` automatically

4\. ✅ Generates the SEA blob

5\. ✅ Creates the executable for your platform

6\. ✅ Cleans up temporary files

\## Example

```bash

\# Installation

npm install --save-dev node2exe



\# Usage

npx node2exe



\# Result

\# ✅ app.exe created! (Windows)

\# ✅ app created! (macOS/Linux)

```

\## Generated files

\- `app.exe` / `app` - Your final executable (ready to distribute)

\- `sea-config.json` - SEA configuration (optional after creation)

\- `node\_modules/` - Contains postject and dependencies

\## Notes

\- The created executable includes all your code and Node.js

\- No external dependencies required to run

\- Typical size: 60-80 MB depending on your app

\- The script is written in pure JavaScript (cross-platform)

\- Each platform generates its own executable
