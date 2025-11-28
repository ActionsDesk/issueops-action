import { MissingRequiredValueError, RegexValidationError } from './types/errors'
import type { FieldConfig, KeyValuePair } from './types/types'

/**
 * Processes a single line of input and updates the JSON object based on the line content.
 * If the line represents a multi-line value or the corresponding JSON property is already an array,
 * the line is processed as a multi-line value. Otherwise, it is processed as a single-line value.
 *
 * @param line The line of input to process.
 * @param currentConfig The current field configuration.
 * @param json The JSON object to update.
 */
function processLine(
  line: string,
  currentConfig: FieldConfig,
  json: KeyValuePair
): void {
  const isMulti = line.match(/^\s*- /)
  if (isMulti || Array.isArray(json[currentConfig.name])) {
    processMultiLine(line, currentConfig, json)
  } else {
    processSingleLine(line, currentConfig, json)
  }
}

function processSingleLine(
  line: string,
  currentConfig: FieldConfig,
  json: KeyValuePair
): void {
  const value = line.trim()
  validateRegex(value, currentConfig)
  json[currentConfig.name] = value
}

/**
 * Processes values where they are spread across multiple lines in a list. Where they
 * are checkboxes, the value is only added if the checkbox is checked.
 *
 * @param line - The line of text to process.
 * @param currentConfig - The current configuration for the field.
 * @param json - The JSON object to update with the processed value.
 */
function processMultiLine(
  line: string,
  currentConfig: FieldConfig,
  json: KeyValuePair
): void {
  const optionMatch = line.match(/^\s*- \[(.)\] (.*)$/)
  let value
  if (optionMatch) {
    const isChecked = optionMatch[1] !== ' '
    if (isChecked) {
      value = optionMatch[2]
    }
  } else {
    const otherMatch = line.match(/^\s*(- )?(.*)$/)
    if (otherMatch) {
      value = otherMatch[2]
    }
  }
  if (value) {
    validateRegex(value, currentConfig)
    if (!json[currentConfig.name]) {
      json[currentConfig.name] = [value]
    } else if (!Array.isArray(json[currentConfig.name])) {
      json[currentConfig.name] = [json[currentConfig.name] as string, value]
    } else {
      const arr = json[currentConfig.name] as string[]
      arr.push(value)
    }
  }
}

/**
 * Validates a value against a regular expression.
 * @param value - The value to be validated.
 * @param config - The configuration object containing the regular expression and field name.
 * @throws {RegexValidationError} - If the value does not match the regular expression.
 */
function validateRegex(value: string, config: FieldConfig): void {
  if (config.regex && !new RegExp(config.regex).test(value)) {
    throw new RegexValidationError(
      `Value: \`${value}\` does not match regex for: \`${config.name}\``
    )
  }
}

/**
 * Converts markdown to JSON based on the provided configuration.
 * @param markdown The markdown string to convert.
 * @param config The configuration for mapping markdown to JSON fields.
 * @returns The converted JSON object.
 */
export function markdownToJson(
  markdown: string,
  config: FieldConfig[]
): KeyValuePair {
  const lines = markdown.split(/\r?\n/)
  const json: KeyValuePair = {}
  let currentConfig: FieldConfig | null = null

  for (const line of lines) {
    const headingMatch = line.match(/^\s*### (.+)$/)
    if (headingMatch) {
      const label = headingMatch[1].trim()
      currentConfig = config.find(cfg => cfg.label === label) || null
    } else if (currentConfig && line.trim()) {
      processLine(line, currentConfig, json)
    }
  }

  for (const field of config) {
    if (field.required === true && !json[field.name]) {
      throw new MissingRequiredValueError(
        `Value for: \`${field.name}\` is required`
      )
    }
  }

  return json
}
