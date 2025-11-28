import { Octokit } from '@octokit/rest'
import { JobIsolationError, JobNotFoundError } from './types/errors'
import { ActionsCoreWrapper } from './types/wrappers.d'
import wait from './utils/wait'

const STEP_NAME = 'Upload Execution Report'

// 5 retries starting with 10 seconds and multiplying each time by 2
// so the total time is 10 + 20 + 40 + 80 + 160 = 310 seconds (approx 5 minutes)
const MAX_RETRIES = 5
const WAIT_TIME_MS = 10000

/**
 * Identifies the job ID for a specific workflow run attempt.
 *
 * @param github - The Octokit instance.
 * @param workflow_name - The name of the workflow.
 * @param run_id - The ID of the workflow run.
 * @param attempt_number - The number of the run attempt.
 * @param owner - The owner of the repository.
 * @param repo - The name of the repository.
 * @param differentiator - An optional differentiator to filter jobs - this is needed when executing inside of a matrix job
 *                         and will be the matrix value represented by the job name in brackets. For example, if the job
 *                         name is "Test (Node 12)", the differentiator would be "Node 12".
 * @returns The job ID.
 * @throws {JobNotFoundError} If the job is not found.
 */
export async function identifyJobId(
  github: Octokit,
  workflow_name: string,
  run_id: number,
  attempt_number: number,
  owner: string,
  repo: string,
  differentiator?: string,
  core?: ActionsCoreWrapper,
  retries_remaining: number = MAX_RETRIES,
  wait_time_ms: number = WAIT_TIME_MS
): Promise<number> {
  const jobs = await github.paginate(
    github.rest.actions.listJobsForWorkflowRunAttempt,
    {
      owner,
      repo,
      run_id,
      attempt_number
    }
  )

  if (core) {
    core.debug(`Jobs: ${JSON.stringify(jobs)}`)
  }

  let regex = new RegExp(`.*`, 'i')
  if (differentiator) {
    const escapedDifferentiator = differentiator.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )
    if (core) {
      core.debug(`Differentiator: ${escapedDifferentiator}`)
    }
    regex = new RegExp(`\\(${escapedDifferentiator}\\)`, 'i')
  }

  const uploadJobs = jobs.filter(
    item =>
      item.workflow_name === workflow_name &&
      item.steps &&
      regex.test(item.name) &&
      item.steps.find(
        step => step.name === STEP_NAME && step.status === 'in_progress'
      )
  )
  if (core) {
    core.debug(
      `Number jobs found: ${uploadJobs.length} for step name: ${STEP_NAME}`
    )
  }

  if (uploadJobs.length > 1) {
    throw new JobIsolationError('Multiple jobs found')
  }

  if (uploadJobs.length === 0) {
    if (retries_remaining > 0) {
      if (core) {
        core.debug(
          `Number jobs found: ${uploadJobs.length} for differentiator: ${differentiator}`
        )
        core.debug(
          `Retries remaining: ${retries_remaining} for differentiator: ${differentiator}`
        )
        core.debug(
          `Job not found, retrying after ${
            wait_time_ms / 1000
          }s with ${retries_remaining} retries remaining.`
        )
      }

      await wait(wait_time_ms)
      return identifyJobId(
        github,
        workflow_name,
        run_id,
        attempt_number,
        owner,
        repo,
        differentiator,
        core,
        retries_remaining - 1,
        wait_time_ms * 2
      )
    }
    throw new JobNotFoundError('Job not found')
  }

  const jobDetails = uploadJobs[0]

  return jobDetails?.id ?? 0
}
