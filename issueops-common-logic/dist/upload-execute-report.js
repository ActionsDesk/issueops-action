const { 
  uploadExecuteReport, 
  actions_core: core, 
  github_context: context, 
  github_getOctokit: getOctokit 
} = require('./index.js')

async function main() {
  try {
    const github = getOctokit(core.getInput('github-token') || process.env.GITHUB_TOKEN || '')
    const result = await uploadExecuteReport({ core, github, context, process })
    if (result) {
      core.setOutput('result', result)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()