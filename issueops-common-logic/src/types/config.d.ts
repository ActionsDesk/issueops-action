export interface FieldConfig {
  name: string
  label: string
  regex?: string
  matrix?: boolean
  required?: boolean
}

export interface CommandConfig {
  command: string
  environment?: string
  additionalParams?: string[]
  report?: ReportConfig
}

export interface ReportConfig {
  type: 'table' | 'markdown'
  columns?: ReportFieldConfig[]
}

export interface ReportFieldConfig {
  attribute: string
  title: string
}

export interface IssueOpsConfig {
  create_comment_for_workflow_runs: boolean
  label_during_execution?: string
}
