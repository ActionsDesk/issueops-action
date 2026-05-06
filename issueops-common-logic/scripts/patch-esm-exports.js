#!/usr/bin/env node

/**
 * Patches @actions/* packages to add a 'require' condition to their exports field.
 * These packages only export ESM via the 'import' condition, which prevents ncc (webpack)
 * from resolving them when building CJS output.
 */

const fs = require('fs')
const path = require('path')

const packagesToPath = [
  '@actions/artifact',
  '@actions/core',
  '@actions/github',
  '@actions/glob'
]

for (const pkg of packagesToPath) {
  const pkgJsonPath = path.join(
    __dirname,
    '..',
    'node_modules',
    pkg,
    'package.json'
  )

  if (!fs.existsSync(pkgJsonPath)) {
    console.log(`Skipping ${pkg} (not installed)`)
    continue
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))

  if (!pkgJson.exports) {
    console.log(`Skipping ${pkg} (no exports field)`)
    continue
  }

  let patched = false

  for (const [, value] of Object.entries(pkgJson.exports)) {
    if (typeof value === 'object' && value.import && !value.require) {
      value.require = value.import
      patched = true
    }
  }

  if (patched) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n')
    console.log(`Patched exports in ${pkg}`)
  } else {
    console.log(`No patching needed for ${pkg}`)
  }
}
