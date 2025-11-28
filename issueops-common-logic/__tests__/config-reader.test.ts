import { jest, describe, test, expect } from '@jest/globals'
import { ConfigReader } from '../src/config-reader'
import * as fs from 'fs'
import * as path from 'path'
import { MultipleMatrixFieldsError } from '../src/types/errors'

jest.mock('fs')

describe('ConfigReader', () => {
  const basePath = '/base/path'
  const configReader = new ConfigReader(basePath)

  test('should construct with correct configFolderPath', () => {
    expect(configReader.configFolderPath).toEqual(path.join(basePath, 'config'))
  })

  test('should read and parse the fields.json file', () => {
    const mockFieldConfig = {
      name: 'source-repo-from-issue',
      label: 'Source Repository',
      regex: '.*'
    }
    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify([mockFieldConfig]))

    const result = configReader.getFieldConfig()

    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(basePath, 'config', 'fields.json'),
      'utf8'
    )

    expect(result).toHaveLength(1)
    const configResult = result[0]
    expect(configResult.name).toEqual(mockFieldConfig.name)
    expect(configResult.label).toEqual(mockFieldConfig.label)
    expect(configResult.regex).toEqual(mockFieldConfig.regex)
  })

  test('should read and parse the commands.json file', () => {
    const mockCommandConfig = [{ command: 'audit' }, { command: 'migrate' }]
    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify(mockCommandConfig))

    const result = configReader.getCommandConfig()

    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(basePath, 'config', 'commands.json'),
      'utf8'
    )

    expect(result).toHaveLength(mockCommandConfig.length)
    for (const commandConfig of mockCommandConfig) {
      expect(result).toContainEqual(commandConfig)
    }
  })

  test('should read and parse the issueops.json file', () => {
    const mockIssueOpsConfig = {
      'create-issues-for-workflow-runs': true
    }
    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify(mockIssueOpsConfig))

    const result = configReader.getIssueOpsConfig()

    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(basePath, 'config', 'issueops.json'),
      'utf8'
    )

    expect(result).toEqual(mockIssueOpsConfig)
  })

  test('should read and parse the custom-config.json file', () => {
    const mockCustomConfig = {
      'custom-key': 'custom-value'
    }
    ;(
      fs.existsSync as jest.MockedFunction<typeof fs.existsSync>
    ).mockReturnValue(true)
    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify(mockCustomConfig))

    const result = configReader.getCustomConfig()

    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(basePath, 'config', 'custom-config.json'),
      'utf8'
    )

    expect(result).toEqual(mockCustomConfig)
  })

  test('should read and merge the environment-specific custom-config.json file', () => {
    const mockCustomConfig = {
      'custom-key': 'custom-value',
      'environment-key': 'default-value'
    }
    const mockEnvironmentConfig = {
      'environment-key': 'environment-value'
    }

    ;(
      fs.existsSync as jest.MockedFunction<typeof fs.existsSync>
    ).mockReturnValue(true)

    // Required use of `any` because of mockImplementation signature and typescript
    // since it returns (Buffer | string) TS is complaining that it can't be string
    // because it must be Buffer, but when output is buffer it will complain that
    // it can't be Buffer because it must be string :(
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    ;(fs.readFileSync as jest.MockedFunction<any>).mockImplementation(
      (pofd: fs.PathOrFileDescriptor) => {
        if (pofd.toString().includes('custom-config-environment.json')) {
          return JSON.stringify(mockEnvironmentConfig)
        }
        return JSON.stringify(mockCustomConfig)
      }
    )

    const result = configReader.getCustomConfig('environment')

    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(basePath, 'config', 'custom-config.json'),
      'utf8'
    )
    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(basePath, 'config', 'custom-config-environment.json'),
      'utf8'
    )

    expect(result).toEqual({
      'custom-key': 'custom-value',
      'environment-key': 'environment-value'
    })
  })

  test('should return an empty object if custom-config.json does not exist', () => {
    const error = new Error('File not found')

    ;(
      fs.existsSync as jest.MockedFunction<typeof fs.existsSync>
    ).mockReturnValue(false)
    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockImplementation(() => {
      throw error
    })

    const result = configReader.getCustomConfig()

    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join(basePath, 'config', 'custom-config.json')
    )

    expect(result).toEqual({})
  })

  test('When no matrix field is configured return null', () => {
    const mockFieldConfig = [
      {
        name: 'source-org',
        label: 'Source Organization'
      },
      {
        name: 'source-repos',
        label: 'Source Repos'
      }
    ]

    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify(mockFieldConfig))

    const result = configReader.getMatrixField()

    expect(result).toEqual(null)
  })

  test('When two matrix field are configured throw error', () => {
    const mockFieldConfig = [
      {
        name: 'source-org',
        label: 'Source Organization',
        matrix: true
      },
      {
        name: 'source-repos',
        label: 'Source Repos',
        matrix: true
      }
    ]

    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify(mockFieldConfig))

    expect(() => configReader.getMatrixField()).toThrow(
      MultipleMatrixFieldsError
    )
  })

  test('When correctly set, return name of matrix field', () => {
    const mockFieldConfig = [
      {
        name: 'source-org',
        label: 'Source Organization'
      },
      {
        name: 'source-repos',
        label: 'Source Repos',
        matrix: true
      }
    ]

    ;(
      fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>
    ).mockReturnValue(JSON.stringify(mockFieldConfig))

    const result = configReader.getMatrixField()

    expect(result).toEqual('source-repos')
  })
})
