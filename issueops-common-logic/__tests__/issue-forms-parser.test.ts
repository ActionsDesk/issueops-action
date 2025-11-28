import { markdownToJson } from '../src/issue-forms-parser'
import { test, expect } from '@jest/globals'

const configExample = {
  fields: [
    {
      name: 'field1',
      label: 'Field 1',
      regex: '.*'
    },
    {
      name: 'field2',
      label: 'Field 2',
      regex: '.*'
    },
    {
      name: 'options',
      label: 'Options',
      regex: '.*'
    }
  ]
}

test('parses empty markdown correctly', () => {
  const markdown = ''

  const expected = {}

  expect(markdownToJson(markdown, configExample.fields)).toEqual(expected)
})

test('parses markdown with single value correctly', () => {
  const markdown = `
    ### Field 1

    Value 1
    `

  const expected = {
    field1: 'Value 1'
  }

  expect(markdownToJson(markdown, configExample.fields)).toEqual(expected)
})

test('parses value with windows line endings', () => {
  const markdown = `### Field 1\r\n\r\nValue 1`

  const expected = {
    field1: 'Value 1'
  }

  expect(markdownToJson(markdown, configExample.fields)).toEqual(expected)
})

test('parses markdown with multiple values correctly', () => {
  const markdown = `
    ### Field 1

    Value 1

    ### Field 2

    Value 2
    `

  const expected = {
    field1: 'Value 1',
    field2: 'Value 2'
  }

  expect(markdownToJson(markdown, configExample.fields)).toEqual(expected)
})

test('parses markdown with list of values correctly', () => {
  const markdown = `
    ### Options

    - [x] Option 1
    - [X] Option 2
    - [ ] Option 3
    - [ ] Option 4
    `

  const expected = {
    options: ['Option 1', 'Option 2']
  }

  expect(markdownToJson(markdown, configExample.fields)).toEqual(expected)
})

test('throws error when regex does not match', () => {
  const markdown = `### Numeric Value
    
                      Value 1`

  const config = [
    {
      name: 'numericValue',
      label: 'Numeric Value',
      regex: '^\\d+$'
    }
  ]

  expect(() => markdownToJson(markdown, config)).toThrow()
})

test('throws error when required field has no value', () => {
  const markdown = `### Input Value
    
                      Value 1`

  const config = [
    {
      name: 'numericValue',
      label: 'Alternative Value',
      regex: '^[ \\w\\.]+$',
      required: true
    }
  ]

  expect(() => markdownToJson(markdown, config)).toThrow()
})

test('parses markdown with list of values correctly when no regex is provided', () => {
  const markdown = `
      ### My Value
  
      Some text`

  const config = [
    {
      name: 'my_value',
      label: 'My Value'
    }
  ]

  const expected = {
    my_value: 'Some text'
  }

  expect(markdownToJson(markdown, config)).toEqual(expected)
})

test('parses markdown with required field correctly', () => {
  const markdown = `
      ### My Value
  
      Some text`

  const config = [
    {
      name: 'my_value',
      label: 'My Value',
      required: true
    }
  ]

  const expected = {
    my_value: 'Some text'
  }

  expect(markdownToJson(markdown, config)).toEqual(expected)
})

test('parses markdown with non-required field correctly', () => {
  const markdown = `
      ### My Value
  
      Some text`

  const config = [
    {
      name: 'my_value',
      label: 'My Value',
      required: false
    }
  ]

  const expected = {
    my_value: 'Some text'
  }

  expect(markdownToJson(markdown, config)).toEqual(expected)
})

test('parses markdown with field without required property correctly', () => {
  const markdown = `
      ### My Value
  
      ### Next heading`

  const config = [
    {
      name: 'my_value',
      label: 'My Value'
    }
  ]

  const expected = {}

  expect(markdownToJson(markdown, config)).toEqual(expected)
})

test('parses markdown list into array of values', () => {
  const markdown = `
      ### My Value
  
      - Option 1
      - Option 2
      - 
      - Option 3`

  const config = [
    {
      name: 'my_value',
      label: 'My Value'
    }
  ]

  const expected = {
    my_value: ['Option 1', 'Option 2', 'Option 3']
  }

  expect(markdownToJson(markdown, config)).toEqual(expected)
})

test('parses mixed markdown list into array of values when started with string', () => {
  const markdown = `
      ### My Value
  
      Option 1
      - Option 2
      - Option 3`

  const config = [
    {
      name: 'my_value',
      label: 'My Value'
    }
  ]

  const expected = {
    my_value: ['Option 1', 'Option 2', 'Option 3']
  }

  expect(markdownToJson(markdown, config)).toEqual(expected)
})

test('parses mixed markdown list into array of values when string in list', () => {
  const markdown = `
      ### My Value
  
      - Option 1
      Option 2
      - Option 3`

  const config = [
    {
      name: 'my_value',
      label: 'My Value'
    }
  ]

  const expected = {
    my_value: ['Option 1', 'Option 2', 'Option 3']
  }

  expect(markdownToJson(markdown, config)).toEqual(expected)
})
