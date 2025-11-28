import { ConfigReader } from './config-reader'
import { Context } from '@actions/github/lib/context'
import { Octokit } from '@octokit/rest'
import {
  addLabelToIssue,
  createWarningComment,
  createWorkflowComment,
  createWorkflowEndComment,
  createWorkflowStartComment,
  removeLabelFromIssue
} from './comment-actions'
import { markdownToJson } from './issue-forms-parser'
import { parseCommandFromComment } from './command-reader'
import { WarningError } from './types/errors'
import { uploadArtifact } from './artifact-upload'
import fs from 'fs'
import { generateMarkdownTable, getExecuteReportFiles } from './reporting-logic'
import { ActionsCoreWrapper } from './types/wrappers.d'
import { identifyJobId } from './job-identifier'

// Export bundled dependencies for use by wrapper files
import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'

export {
  core as actions_core,
  context as github_context,
  getOctokit as github_getOctokit
}

/**
 * Runs the main logic of the program for setting up IssueOps.
 *
 * @param core - The ActionsCoreWrapper instance to import functions required from @actions/core.
 * @param github - The default actions Octokit instance.
 * @param context - The default actions Context instance.
 * @param process - The NodeJS.Process instance.
 */
export async function setup({
  core,
  github,
  context,
  process
}: {
  core: ActionsCoreWrapper
  github: Octokit
  context: Context
  process: NodeJS.Process
}): Promise<string> {
  try {
    const body = context.payload.issue?.body ?? ''
    core.debug(`Issue body: ${body}`)
    const configReader = new ConfigReader(process.env.GITHUB_WORKSPACE ?? '')

    const issueOpsConfig = configReader.getIssueOpsConfig()
    core.debug(`IssueOps config: ${JSON.stringify(issueOpsConfig)}`)
    if (issueOpsConfig.create_comment_for_workflow_runs === true) {
      await createWorkflowStartComment(github, context)
    }

    if (issueOpsConfig.label_during_execution) {
      await addLabelToIssue(
        github,
        context,
        issueOpsConfig.label_during_execution
      )
    }

    const fieldConfig = configReader.getFieldConfig()
    core.debug(`Field config: ${JSON.stringify(fieldConfig)}`)
    const issueData = markdownToJson(body, fieldConfig)
    core.debug(`Issue data: ${JSON.stringify(issueData)}`)

    const commandConfig = configReader.getCommandConfig()
    core.debug(`Command config: ${JSON.stringify(commandConfig)}`)
    const command = parseCommandFromComment(
      context.payload.comment?.body ?? '',
      commandConfig
    )

    const customConfig = configReader.getCustomConfig(command.environment)
    core.debug(`Custom config: ${JSON.stringify(customConfig)}`)

    const matrixField = configReader.getMatrixField()
    core.debug(`Matrix field: ${matrixField}`)
    let matrix = ['job1']
    if (matrixField !== null) {
      const matrixValue = issueData[matrixField]
      if (matrixValue !== undefined) {
        matrix = Array.isArray(matrixValue) ? matrixValue : [matrixValue]
      }
    }

    const result = {
      issue_data: issueData,
      command,
      custom_config: customConfig,
      matrix
    }
    return JSON.stringify(result)
  } catch (error) {
    await handleError(error, github, context, core)
    return '{}'
  }
}

/**
 * Runs the main logic of the program for tearing down IssueOps.
 *
 * @param core - The ActionsCoreWrapper instance to import functions required from @actions/core.
 * @param github - The default actions Octokit instance.
 * @param context - The default actions Context instance.
 * @param process - The NodeJS.Process instance.
 */
export async function tearDown({
  core,
  github,
  context,
  process
}: {
  core: ActionsCoreWrapper
  github: Octokit
  context: Context
  process: NodeJS.Process
}): Promise<void> {
  try {
    const configReader = new ConfigReader(process.env.GITHUB_WORKSPACE ?? '')

    const issueOpsConfig = configReader.getIssueOpsConfig()
    if (issueOpsConfig.create_comment_for_workflow_runs === true) {
      await createWorkflowEndComment(github, context)
    }

    if (issueOpsConfig.label_during_execution) {
      await removeLabelFromIssue(
        github,
        context,
        issueOpsConfig.label_during_execution
      )
    }
  } catch (error) {
    await handleError(error, github, context, core)
  }
}

/**
 * Uploads the execute report to GitHub artifacts.

 * @param {Object} options - The options for uploading the execute report.
 * @param {ActionsCoreWrapper} options.core - The wrapper for core GitHub actions functions.
 * @param {Octokit} options.github - The Octokit instance for interacting with GitHub API.
 * @param {Context} options.context - The context object containing information about the repository and workflow.
 * @param {NodeJS.Process} options.process - The Node.js process object.
 * @returns {Promise<void>} - A promise that resolves when the execute report is uploaded successfully.
 */
export async function uploadExecuteReport({
  core,
  github,
  context,
  process
}: {
  core: ActionsCoreWrapper
  github: Octokit
  context: Context
  process: NodeJS.Process
}): Promise<void> {
  try {
    const basepath = process.env.GITHUB_WORKSPACE ?? ''
    const reportFilePath = `${basepath}/execute-report.json`
    const workflow_name = process.env.GITHUB_WORKFLOW ?? ''
    const differentiator =
      core.getInput('differentiator') || process.env.DIFFERENTIATOR || ''
    const run_id = parseInt(process.env.GITHUB_RUN_ID ?? '0')
    const attempt_number = parseInt(process.env.GITHUB_RUN_ATTEMPT ?? '0')
    const { owner, repo } = context.repo

    core.debug(`Differentiator: ${differentiator}`)
    core.debug(`Run ID: ${run_id}`)
    core.debug(`Attempt number: ${attempt_number}`)

    if (!fs.existsSync(reportFilePath)) {
      core.debug(`File ${reportFilePath} does not exist`)
      return
    }

    const id = await identifyJobId(
      github,
      workflow_name,
      run_id,
      attempt_number,
      owner,
      repo,
      differentiator,
      core
    )

    const artifactName = `execute-report-${id}.json`

    await uploadArtifact(artifactName, [reportFilePath], basepath, {
      retentionDays: 1
    })
  } catch (error) {
    await handleError(error, github, context, core)
  }
}

/**
 * Adds a report comment based on the command provided in the comment body.
 * @param {Object} options - The options object.
 * @param {ActionsCoreWrapper} options.core - The ActionsCoreWrapper instance.
 * @param {Octokit} options.github - The Octokit instance.
 * @param {Context} options.context - The Context instance.
 * @param {NodeJS.Process} options.process - The NodeJS.Process instance.
 * @returns {Promise<void>} - A promise that resolves when the report comment is added.
 */
export async function addReportComment({
  core,
  github,
  context,
  process
}: {
  core: ActionsCoreWrapper
  github: Octokit
  context: Context
  process: NodeJS.Process
}): Promise<void> {
  try {
    const configReader = new ConfigReader(process.env.GITHUB_WORKSPACE ?? '')
    const commandConfig = configReader.getCommandConfig()
    core.debug(`Command config: ${JSON.stringify(commandConfig)}`)
    const command = parseCommandFromComment(
      context.payload.comment?.body ?? '',
      commandConfig
    )

    if (command.report) {
      const files = await getExecuteReportFiles()
      core.debug(`Files: ${JSON.stringify(files)}`)
      for (const file of files) {
        const markDown = generateMarkdownTable(
          JSON.parse(file.fileData),
          command.report
        )
        await createWorkflowComment(github, context, markDown)
      }
    }
  } catch (error) {
    await handleError(error, github, context, core)
  }
}

/**
 * Handles errors that occur during the execution of the program.
 * If the error is an instance of WarningError, it creates a warning comment using the provided GitHub client, context, and error message.
 * If the error is an instance of Error, it sets the program as failed using the provided ActionsCoreWrapper and logs the error message and stack trace.
 * @param error - The error that occurred.
 * @param github - The Octokit instance for interacting with GitHub.
 * @param context - The context object containing information about the GitHub action.
 * @param core - The ActionsCoreWrapper instance for interacting with the GitHub Actions core library.
 */
async function handleError(
  error: unknown,
  github: Octokit,
  context: Context,
  core: ActionsCoreWrapper
): Promise<void> {
  if (error instanceof WarningError) {
    await createWarningComment(github, context, error.message)
  }
  if (error instanceof Error) {
    core.setFailed(error.message)
    core.debug(error.stack ?? '')
  }
}
