#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Entry points to create
const entryPoints = [
  'setup',
  'tearDown', 
  'addReportComment',
  'uploadExecuteReport'
]

// Template for wrapper scripts
const createWrapperContent = (functionName) => `const { 
  ${functionName}, 
  actions_core: core, 
  github_context: context, 
  github_getOctokit: getOctokit 
} = require('./index.js')

async function main() {
  try {
    const github = getOctokit(core.getInput('github-token') || process.env.GITHUB_TOKEN || '')
    const result = await ${functionName}({ core, github, context, process })
    if (result) {
      core.setOutput('result', result)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()`

// Create wrapper files
const distDir = path.join(__dirname, '..', 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir)
}

entryPoints.forEach(entryPoint => {
  const filename = entryPoint === 'tearDown' ? 'teardown.js' : 
                   entryPoint === 'addReportComment' ? 'add-report-comment.js' :
                   entryPoint === 'uploadExecuteReport' ? 'upload-execute-report.js' :
                   `${entryPoint}.js`
  
  const filePath = path.join(distDir, filename)
  const content = createWrapperContent(entryPoint)
  
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`Created wrapper: ${filename}`)
})

console.log('All wrapper files created successfully!')
