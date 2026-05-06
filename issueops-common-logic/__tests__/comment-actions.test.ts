import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { Octokit } from '@octokit/rest'
import { Context } from '@actions/github/lib/context'
import {
  addLabelToIssue,
  createWarningComment,
  createWorkflowEndComment,
  createWorkflowStartComment,
  removeLabelFromIssue
} from '../src/comment-actions'
import { IssueLabelAlreadyAssignedError } from '../src/types/errors'

function createMockOctokit(): Octokit & {
  rest: {
    issues: {
      createComment: jest.Mock
      addLabels: jest.Mock
      removeLabel: jest.Mock
    }
  }
  paginate: jest.Mock<(...args: unknown[]) => Promise<unknown>>
} {
  return {
    rest: {
      issues: {
        createComment: jest
          .fn<() => Promise<Record<string, unknown>>>()
          .mockResolvedValue({}),
        addLabels: jest
          .fn<() => Promise<Record<string, unknown>>>()
          .mockResolvedValue({}),
        removeLabel: jest
          .fn<() => Promise<Record<string, unknown>>>()
          .mockResolvedValue({})
      }
    },
    paginate: jest.fn<(...args: unknown[]) => Promise<unknown>>()
  } as unknown as Octokit & {
    rest: {
      issues: {
        createComment: jest.Mock
        addLabels: jest.Mock
        removeLabel: jest.Mock
      }
    }
    paginate: jest.Mock<(...args: unknown[]) => Promise<unknown>>
  }
}

function createMockContext(): Context {
  return {
    serverUrl: 'https://github.com',
    runId: 1234,
    repo: { owner: 'i-am-the-owner', repo: 'my-repo' },
    payload: {
      repository: {
        owner: { login: 'i-am-the-owner' },
        name: 'my-repo'
      },
      issue: { number: 1 }
    }
  } as unknown as Context
}

describe('comment-actions tests', () => {
  let github: ReturnType<typeof createMockOctokit>
  let context: Context

  beforeEach(() => {
    github = createMockOctokit()
    context = createMockContext()
  })

  describe('createWorkflowStartComment', () => {
    it('should create a comment', async () => {
      await createWorkflowStartComment(github, context)
      expect(github.rest.issues.createComment).toHaveBeenCalledWith({
        owner: context.payload.repository!.owner.login,
        repo: context.payload.repository!.name,
        issue_number: context.payload.issue?.number ?? 0,
        body: `🟢 IssueOps workflow started: [1234](https://github.com/i-am-the-owner/my-repo/actions/runs/1234)`
      })
    })

    it('should create a comment with a warning', async () => {
      const message = 'My warning message'
      await createWarningComment(github, context, message)
      expect(github.rest.issues.createComment).toHaveBeenCalledWith({
        owner: context.payload.repository!.owner.login,
        repo: context.payload.repository!.name,
        issue_number: context.payload.issue?.number ?? 0,
        body: `⚠️ ${message}`
      })
    })
  })

  describe('createWorkflowEndComment', () => {
    it('should create a comment', async () => {
      await createWorkflowEndComment(github, context)
      expect(github.rest.issues.createComment).toHaveBeenCalledWith({
        owner: context.payload.repository!.owner.login,
        repo: context.payload.repository!.name,
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
        owner: context.payload.repository!.owner.login,
        repo: context.payload.repository!.name,
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
