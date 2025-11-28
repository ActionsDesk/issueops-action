import { ReportConfig } from './config.d'

export interface KeyValuePair {
  [key: string]: string | string[]
}

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

export interface JSONObject {
  [k: string]: JSONValue
}

export interface FieldConfig {
  label: string
  name: string
  regex?: string
  required?: boolean
}

export interface CommandOutput {
  command: string
  additionalValues: { [key: string]: string | number }
  skip: boolean
  environment?: string
  report?: ReportConfig
}

export interface ExecuteReportFile {
  runId: number
  fileData: string
}
