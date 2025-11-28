import { describe, test, expect } from '@jest/globals'
import { parseCommandFromComment } from '../src/command-reader'
import {
  CommandAdditionalValuesError,
  InvalidCommandError
} from '../src/types/errors'

describe('parseCommandFromComment', () => {
  const commandConfig = [
    { command: 'fix' },
    { command: 'test' },
    { command: 'test3inputs', additionalParams: ['input1', 'input2', 'input3'] }
  ]

  test('should match command case insensitively', () => {
    const comment = '/FIX'
    const result = parseCommandFromComment(comment, commandConfig)
    expect(result).toEqual({
      command: 'fix',
      additionalValues: {},
      skip: false
    })
  })

  test('should return command as in config', () => {
    const comment = '/test'
    const result = parseCommandFromComment(comment, commandConfig)
    expect(result).toEqual({
      command: 'test',
      additionalValues: {},
      skip: false
    })
  })

  test('should throw error when command is not matched', () => {
    const comment = '/unknown'
    expect(() => parseCommandFromComment(comment, commandConfig)).toThrow(
      InvalidCommandError
    )
  })

  test('should return additional values', () => {
    const comment = '/test3inputs value1 value2 "value 3"'
    const result = parseCommandFromComment(comment, commandConfig)
    expect(result).toEqual({
      command: 'test3inputs',
      additionalValues: {
        input1: 'value1',
        input2: 'value2',
        input3: 'value 3'
      },
      skip: false
    })
  })

  test('should handle escaped quotes in additional values', () => {
    const comment = '/test3inputs value1 value2 "value \\"3\\" 4"'
    const result = parseCommandFromComment(comment, commandConfig)
    expect(result).toEqual({
      command: 'test3inputs',
      additionalValues: {
        input1: 'value1',
        input2: 'value2',
        input3: 'value "3" 4'
      },
      skip: false
    })
  })

  test('should handle backslashes in additional values', () => {
    const comment = '/test3inputs value1 value2 "value \\\\3\\\\ 4"'
    const result = parseCommandFromComment(comment, commandConfig)
    expect(result).toEqual({
      command: 'test3inputs',
      additionalValues: {
        input1: 'value1',
        input2: 'value2',
        input3: 'value \\3\\ 4'
      },
      skip: false
    })
  })

  test('should fail if there are less values then expected', () => {
    const comment = '/test3inputs value1 value2'
    expect(() => parseCommandFromComment(comment, commandConfig)).toThrow(
      CommandAdditionalValuesError
    )
  })

  test('should fail if there are more values then expected', () => {
    const comment = '/test3inputs value1 value2 value3 value4'
    expect(() => parseCommandFromComment(comment, commandConfig)).toThrow(
      CommandAdditionalValuesError
    )
  })

  test('should return skip value of true if comment does not start with a slash', () => {
    const comment = 'test value1 value2 "value 3"'
    const result = parseCommandFromComment(comment, commandConfig)
    expect(result).toEqual({
      command: '',
      additionalValues: {},
      skip: true
    })
  })
})
