import { Octokit } from '@octokit/rest'
import { Context } from '@actions/github/lib/context'
import { IssueLabelAlreadyAssignedError } from './types/errors'

export async function createWorkflowComment(
  github: Octokit,
  context: Context,
  body: string
): Promise<void> {
  await github.rest.issues.createComment({
    owner: context.payload.repository?.owner.login ?? '',
    repo: context.payload.repository?.name ?? '',
    issue_number: context.payload.issue?.number ?? 0,
    body
  })
}

export async function createWorkflowStartComment(
  github: Octokit,
  context: Context
): Promise<void> {
  const body = `🟢 IssueOps workflow started: [${context.runId}](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`
  await createWorkflowComment(github, context, body)
}

export async function createWorkflowEndComment(
  github: Octokit,
  context: Context
): Promise<void> {
  const body = `🔴 IssueOps workflow completed: [${context.runId}](${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`
  await createWorkflowComment(github, context, body)
}

export async function createWarningComment(
  github: Octokit,
  context: Context,
  message: string
): Promise<void> {
  const body = `⚠️ ${message}`
  await createWorkflowComment(github, context, body)
}

export async function addLabelToIssue(
  github: Octokit,
  context: Context,
  label: string
): Promise<void> {
  const response = await github.paginate(github.rest.issues.listLabelsOnIssue, {
    ...context.repo,
    issue_number: context.payload.issue?.number ?? 0
  })

  for (const item of response) {
    if (item.name === label) {
      throw new IssueLabelAlreadyAssignedError(
        `Label: \`${label}\` already assigned to this issue which indicates that a previous command is still executing. If this is incorrect, please remove the label manually and try again.`
      )
    }
  }

  await github.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.issue?.number ?? 0,
    labels: [`${label}`]
  })
}

export async function removeLabelFromIssue(
  github: Octokit,
  context: Context,
  label: string
): Promise<void> {
  const response = await github.paginate(github.rest.issues.listLabelsOnIssue, {
    ...context.repo,
    issue_number: context.payload.issue?.number ?? 0
  })

  for (const item of response) {
    if (item.name === label) {
      await github.rest.issues.removeLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.issue?.number ?? 0,
        name: `${label}`
      })
    }
  }
}
