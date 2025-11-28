// Mock @actions/glob before any imports to avoid constants issues
jest.mock('@actions/glob', () => ({
  create: jest.fn()
}))

jest.mock('fs', () => ({
  promises: {
    access: jest.fn()
  },
  readFileSync: jest.fn()
}))

import { ReportConfig } from '../src/types/config.d'
import { MissingMarkdownAttributeError } from '../src/types/errors'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import * as glob from '@actions/glob'
import * as fs from 'fs'
import {
  generateMarkdownTable,
  getExecuteReportFiles
} from '../src/reporting-logic'

describe('generateMarkdownTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Generates Markdown table with column attributes', () => {
    const dynamicJson = JSON.parse(`[
      { "id": 1, "name": "John", "age": 25 },
      { "id": 2, "name": "Jane", "age": 30 }
    ]`)

    const config: ReportConfig = {
      type: 'table',
      columns: [
        { attribute: 'id', title: 'ID' },
        { attribute: 'name', title: 'Name' },
        { attribute: 'age', title: 'Age' }
      ]
    }

    const expectedOutput = `| ID | Name | Age |\n| --- | --- | --- |\n| 1 | John | 25 |\n| 2 | Jane | 30 |\n`

    const result = generateMarkdownTable(dynamicJson, config)

    expect(result).toEqual(expectedOutput)
  })

  test('Generates Markdown table with column attributes when some attributes are unspecified', () => {
    const dynamicJson = JSON.parse(`[
      { "id": 1, "name": "John", "age": 25 },
      { "id": 2, "name": "Jane" }
    ]`)

    const config: ReportConfig = {
      type: 'table',
      columns: [
        { attribute: 'id', title: 'ID' },
        { attribute: 'name', title: 'Name' },
        { attribute: 'age', title: 'Age' }
      ]
    }

    const expectedOutput = `| ID | Name | Age |\n| --- | --- | --- |\n| 1 | John | 25 |\n| 2 | Jane |  |\n`

    const result = generateMarkdownTable(dynamicJson, config)

    expect(result).toEqual(expectedOutput)
  })

  test('Output markdown data directly', () => {
    const dynamicJson = JSON.parse(
      `{ "markdown": "Some **bold** text.* List item 1* List item 2" }`
    )

    const config: ReportConfig = { type: 'markdown' }
    const expectedOutput = `Some **bold** text.* List item 1* List item 2`

    const result = generateMarkdownTable(dynamicJson, config)

    expect(result).toEqual(expectedOutput)
  })

  test('Throws MissingMarkdownAttributeError when json is missing "markdown" attribute', () => {
    const dynamicJson = JSON.parse(`{ "someAttribute": "Some value" }`)
    const config: ReportConfig = { type: 'markdown' }

    expect(() => {
      generateMarkdownTable(dynamicJson, config)
    }).toThrow(MissingMarkdownAttributeError)
  })

  test('Throws MissingMarkdownAttributeError when json contains an array', () => {
    const dynamicJson = JSON.parse(`[{ "someAttribute": "Some value" }]`)
    const config: ReportConfig = { type: 'markdown' }

    expect(() => {
      generateMarkdownTable(dynamicJson, config)
    }).toThrow(MissingMarkdownAttributeError)
  })
})

describe('getExecuteReportFiles', () => {
  let mockGlobber: DeepMockProxy<glob.Globber>

  beforeEach(() => {
    jest.clearAllMocks()
    mockGlobber = mockDeep<glob.Globber>()
    ;(glob.create as jest.MockedFunction<typeof glob.create>).mockResolvedValue(
      mockGlobber
    )
  })

  it('returns execute report files with parsed runId and file data', async () => {
    const mockReportFile = {
      markdown: '## Test'
    }
    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify(mockReportFile))
    mockGlobber.glob.mockResolvedValue([
      'execute-report-123.json',
      'execute-report-456.json'
    ])

    const result = await getExecuteReportFiles()

    expect(result).toEqual([
      { runId: 123, fileData: '{"markdown":"## Test"}' },
      { runId: 456, fileData: '{"markdown":"## Test"}' }
    ])
    expect(glob.create).toHaveBeenCalledWith(
      'execute-reports/**/execute-report-*.json',
      { matchDirectories: false }
    )
    expect(fs.readFileSync).toHaveBeenCalledWith(
      'execute-report-123.json',
      'utf8'
    )
    expect(fs.readFileSync).toHaveBeenCalledWith(
      'execute-report-456.json',
      'utf8'
    )
  })

  it('returns runId = 0 when number cannot be parsed', async () => {
    const mockReportFile = {
      markdown: '## Test'
    }
    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify(mockReportFile))

    mockGlobber.glob.mockResolvedValue(['execute-report-aaa.json'])

    const result = await getExecuteReportFiles()

    expect(result).toEqual([{ runId: 0, fileData: '{"markdown":"## Test"}' }])
  })
})
