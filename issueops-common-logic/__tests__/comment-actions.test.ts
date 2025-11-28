/* eslint-disable  @typescript-eslint/no-explicit-any */

import { Octokit } from '@octokit/rest'
import { Context } from '@actions/github/lib/context'
import {
  addLabelToIssue,
  createWarningComment,
  createWorkflowEndComment,
  createWorkflowStartComment,
  removeLabelFromIssue
} from '../src/comment-actions'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'
import {
  PayloadRepository,
  WebhookPayload
} from '@actions/github/lib/interfaces'
import { IssueLabelAlreadyAssignedError } from '../src/types/errors'

describe('comment-actions tests', () => {
  let github: DeepMockProxy<Octokit>
  let context: DeepMockProxy<Context>

  beforeEach(() => {
    // Prepare mock objects
    github = mockDeep<Octokit>()
    context = mockDeep<Context>()
    context.serverUrl = 'https://github.com'
    context.payload = context.payload || mockDeep<WebhookPayload>()
    context.payload.repository =
      context.payload.repository || mockDeep<PayloadRepository>()
    Object.defineProperty(context.payload.repository, 'name', {
      value: context.payload.repository.name,
      configurable: true,
      writable: true
    })
    context.payload.issue =
      context.payload.issue ||
      (mockDeep<{
        [key: string]: any
        number: number
        html_url?: string | undefined
        body?: string | undefined
      }>() as {
        [key: string]: any
        number: number
        html_url?: string | undefined
        body?: string | undefined
      })

    context.payload.repository.owner.login = 'i-am-the-owner'
    context.payload.repository.name = 'my-repo'
    context.payload.issue.number = 1
    context.runId = 1234
    context.repo.owner = context.payload.repository.owner.login
    context.repo.repo = context.payload.repository.name
  })

  describe('createWorkflowStartComment', () => {
    it('should create a comment', async () => {
      await createWorkflowStartComment(github, context)
      expect(github.rest.issues.createComment).toHaveBeenCalledWith({
        owner: context.payload.repository?.owner.login,
        repo: context.payload.repository?.name,
        issue_number: context.payload.issue?.number ?? 0,
        body: `🟢 IssueOps workflow started: [1234](https://github.com/i-am-the-owner/my-repo/actions/runs/1234)`
      })
    })

    it('should create a comment with a warning', async () => {
      const message = 'My warning message'
      await createWarningComment(github, context, message)
      expect(github.rest.issues.createComment).toHaveBeenCalledWith({
        owner: context.payload.repository?.owner.login,
        repo: context.payload.repository?.name,
        issue_number: context.payload.issue?.number ?? 0,
        body: `⚠️ ${message}`
      })
    })
  })

  describe('createWorkflowEndComment', () => {
    it('should create a comment', async () => {
      await createWorkflowEndComment(github, context)
      expect(github.rest.issues.createComment).toHaveBeenCalledWith({
        owner: context.payload.repository?.owner.login,
        repo: context.payload.repository?.name,
        issue_number: context.payload.issue?.number ?? 0,
        body: `🔴 IssueOps workflow completed: [1234](https://github.com/i-am-the-owner/my-repo/actions/runs/1234)`
      })
    })
  })

  describe('addLabelToIssue', () => {
    it('should add a label to the issue', async () => {
      github.paginate.mockResolvedValueOnce([])

      await addLabelToIssue(github, context, 'bug')

      expect(github.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: context.payload.repository?.owner.login,
        repo: context.payload.repository?.name,
        issue_number: context.payload.issue?.number ?? 0,
        labels: ['bug']
      })
    })

    it('should throw an error if the label is already assigned to the issue', async () => {
      // Mock the response from the API
      github.paginate.mockResolvedValueOnce([
        {
          name: 'bug'
        }
      ])

      await expect(addLabelToIssue(github, context, 'bug')).rejects.toThrow(
        IssueLabelAlreadyAssignedError
      )
      expect(github.rest.issues.addLabels).not.toHaveBeenCalled()
    })
  })

  describe('removeLabelFromIssue', () => {
    const label = 'bug'

    it('should call issues.removeLabel with the correct parameters', async () => {
      github.paginate.mockResolvedValueOnce([
        {
          name: label
        }
      ])

      await removeLabelFromIssue(github, context, label)

      expect(github.rest.issues.removeLabel).toHaveBeenCalledWith({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.issue?.number ?? 0,
        name: label
      })
    })
  })
})
