const fs = require("fs");
const path = require("path");

function patchLightningCss() {
  const root = process.cwd();
  const cjsPath = path.join(root, "node_modules", "lightningcss", "node", "index.js");
  const mjsPath = path.join(root, "node_modules", "lightningcss", "node", "index.mjs");

  if (!fs.existsSync(cjsPath)) {
    console.log("[patch-lightningcss] lightningcss not found, skipping.");
    return;
  }

  const cjsShim = `'use strict';\nmodule.exports = require('lightningcss-wasm');\n`;
  fs.writeFileSync(cjsPath, cjsShim, "utf8");

  if (fs.existsSync(mjsPath)) {
    const mjsShim =
      `export * from 'lightningcss-wasm';\n` +
      `import wasm from 'lightningcss-wasm';\n` +
      `export default wasm;\n`;
    fs.writeFileSync(mjsPath, mjsShim, "utf8");
  }

  console.log("[patch-lightningcss] Patched lightningcss to use lightningcss-wasm.");
}

try {
  patchLightningCss();
} catch (error) {
  console.error("[patch-lightningcss] Failed:", error.message);
  process.exitCode = 1;
}
