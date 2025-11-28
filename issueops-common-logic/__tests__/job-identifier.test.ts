import { identifyJobId } from '../src/job-identifier'
import { Octokit } from '@octokit/rest'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'
import * as fs from 'fs'

jest.mock('../src/utils/wait', () => ({
  __esModule: true,
  default: async () => Promise.resolve(console.log('Dummy wait'))
}))

describe('identify', () => {
  let github: DeepMockProxy<Octokit>

  beforeEach(() => {
    // Create a mock Octokit instance
    github = mockDeep<Octokit>()
  })

  test('should return the correct run ID', async () => {
    // Arrange
    const differentiator = 'git-clone-lfs-migrate'
    const workflow_name = 'testWorkflow'
    const run_id = 123
    const attempt_number = 1
    const owner = 'my-org'
    const repo = 'my-repo'
    const expectedJobId = 21279482083

    // Stub out the Octokit API call
    github.paginate.mockResolvedValueOnce(example1)

    // Act
    const result = await identifyJobId(
      github,
      workflow_name,
      run_id,
      attempt_number,
      owner,
      repo,
      differentiator
    )

    // Assert
    expect(result).toEqual(expectedJobId)
  })

  test('Can return non-matrix nested', async () => {
    // Arrange
    const differentiator = ''
    const workflow_name = 'testWorkflow'
    const run_id = 123
    const attempt_number = 1
    const owner = 'my-org'
    const repo = 'my-repo'
    const expectedJobId = 21283567672

    // Stub out the Octokit API call
    github.paginate.mockResolvedValueOnce(example2)

    // Act
    const result = await identifyJobId(
      github,
      workflow_name,
      run_id,
      attempt_number,
      owner,
      repo,
      differentiator
    )

    // Assert
    expect(result).toEqual(expectedJobId)
  })

  test('Can return correct ID from matrix run with multiple in_progress uploads', async () => {
    // Arrange
    const workflow_name = 'testWorkflow'
    const run_id = 123
    const attempt_number = 1
    const owner = 'my-org'
    const repo = 'my-repo'

    const differentiator1 = 'git-clone-lfs-migrate'
    const differentiator2 = 'git-clone-lfs-migrate2'
    const expectedJobId1 = 21312788471
    const expectedJobId2 = 21312787682

    // Stub out the Octokit API call
    github.paginate.mockResolvedValue(example3)

    // Act
    const result1 = await identifyJobId(
      github,
      workflow_name,
      run_id,
      attempt_number,
      owner,
      repo,
      differentiator1
    )
    const result2 = await identifyJobId(
      github,
      workflow_name,
      run_id,
      attempt_number,
      owner,
      repo,
      differentiator2
    )

    // Assert
    expect(result1).toEqual(expectedJobId1)
    expect(result2).toEqual(expectedJobId2)
  })

  test('Can handled delayed API information in wrong state - pending', async () => {
    // Arrange
    const workflow_name = 'testWorkflow'
    const run_id = 123
    const attempt_number = 1
    const owner = 'my-org'
    const repo = 'my-repo'

    const differentiator1 = 'github_issues'
    const expectedJobId1 = 21767012935

    // Stub out the Octokit API call
    github.paginate
      .mockResolvedValueOnce(example4a)
      .mockResolvedValueOnce(example4b)

    // Act
    const result1 = await identifyJobId(
      github,
      workflow_name,
      run_id,
      attempt_number,
      owner,
      repo,
      differentiator1
    )

    // Assert
    expect(result1).toEqual(expectedJobId1)
  })

  test('Retry when information not yet available in API', async () => {
    // Arrange
    const workflow_name = 'IssueOps - EMU Migration'
    const run_id = 123
    const attempt_number = 1
    const owner = 'my-org'
    const repo = 'my-repo'

    const differentiator1 = 'my-test-differentiator'
    const expectedJobId1 = 26740020918

    // Stub out the Octokit API call
    github.paginate
      .mockResolvedValue(example5a)
      .mockResolvedValue(example5b)
      .mockResolvedValue(example5c)

    // Act
    const result1 = await identifyJobId(
      github,
      workflow_name,
      run_id,
      attempt_number,
      owner,
      repo,
      differentiator1
    )

    // Assert
    expect(result1).toEqual(expectedJobId1)
  })
})

const example1 = JSON.parse(
  fs.readFileSync('./__tests__/data/jobs-paginate-example-1.json', 'utf8')
)
const example2 = JSON.parse(
  fs.readFileSync('./__tests__/data/jobs-paginate-example-2.json', 'utf8')
)
const example3 = JSON.parse(
  fs.readFileSync(
    './__tests__/data/jobs-paginate-example-3-matrix.json',
    'utf8'
  )
)
const example4a = JSON.parse(
  fs.readFileSync(
    './__tests__/data/jobs-paginate-example-4-matrix.json',
    'utf8'
  )
)

const example4b = JSON.parse(
  fs.readFileSync(
    './__tests__/data/jobs-paginate-example-4-matrix-2nd-request.json',
    'utf8'
  )
)

const example5a = JSON.parse(
  fs.readFileSync(
    './__tests__/data/jobs-paginate-example-5-matrix.json',
    'utf8'
  )
)
const example5b = JSON.parse(
  fs.readFileSync(
    './__tests__/data/jobs-paginate-example-5-matrix-2nd-request.json',
    'utf8'
  )
)
const example5c = JSON.parse(
  fs.readFileSync(
    './__tests__/data/jobs-paginate-example-5-matrix-3rd-request.json',
    'utf8'
  )
)
