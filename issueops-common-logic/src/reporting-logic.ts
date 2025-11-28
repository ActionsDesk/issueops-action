import { ReportConfig } from './types/config.d'
import {
  MissingColumnConfigurationError,
  MissingMarkdownAttributeError
} from './types/errors'
import { ExecuteReportFile, JSONValue } from './types/types.d'
import { readFileSync } from 'fs'
import { create } from '@actions/glob'

/**
 * Retrieves the execute report files.
 * @returns A promise that resolves to an array of ExecuteReportFile objects.
 */
export async function getExecuteReportFiles(): Promise<ExecuteReportFile[]> {
  const globber = await create('execute-reports/**/execute-report-*.json', {
    matchDirectories: false
  })
  const files = await globber.glob()
  const executeReportFiles = files.map(f => {
    const runId = parseInt(f.match(/execute-report-(\d+).json/)?.[1] ?? '0')
    const fileData = readFileSync(f, 'utf8')
    return { runId, fileData }
  }) as ExecuteReportFile[]
  return executeReportFiles
}

/**
 * Generates a markdown table based on the provided dynamic JSON and report configuration.
 * @param dynamicJson - The dynamic JSON data.
 * @param config - The report configuration.
 * @returns The generated markdown table.
 * @throws {MissingMarkdownAttributeError} If the config type is 'markdown' but the JSON data does not contain a 'markdown' attribute.
 * @throws {MissingColumnConfigurationError} If the report column configuration is missing or invalid.
 */
export function generateMarkdownTable(
  dynamicJson: JSON,
  config: ReportConfig
): string {
  let jo = JSON.parse(JSON.stringify(dynamicJson)) as JSONValue

  if (config.type === 'markdown') {
    if (jo && typeof jo === 'object' && 'markdown' in jo) {
      return jo.markdown as string
    } else {
      throw new MissingMarkdownAttributeError(
        'Invalid config: Missing markdown attribute'
      )
    }
  }

  if (!config.columns || !Array.isArray(config.columns)) {
    throw new MissingColumnConfigurationError(
      'Invalid config: Missing report column configuration'
    )
  }

  const titles = config.columns.map(c => c.title)

  // Create header row
  const headerRow = `| ${titles.join(' | ')} |\n| ${titles
    .map(() => '---')
    .join(' | ')} |`

  // Create data row
  const attributes = config.columns.map(c => c.attribute)

  let tableRows = ''

  if (!Array.isArray(jo)) jo = [jo]
  for (const record of jo) {
    const rowData = attributes.map(attr => {
      if (record && typeof record === 'object' && attr in record) {
        const value = (record as { [key: string]: JSONValue })[attr]
        return value != null ? String(value) : ''
      }
      return ''
    })
    tableRows += `| ${rowData.join(' | ')} |\n`
  }

  const markdownTable = [headerRow, tableRows].join('\n')

  return markdownTable
}
