import { CommandConfig, FieldConfig, IssueOpsConfig } from './types/config.d'
import * as fs from 'fs'
import * as path from 'path'
import { MultipleMatrixFieldsError } from './types/errors'

export class ConfigReader {
  configFolderPath: string
  constructor(basePath: string) {
    this.configFolderPath = path.join(basePath, 'config')
  }

  getFieldConfig(): FieldConfig[] {
    const absolutePath = path.join(this.configFolderPath, 'fields.json')
    const fileContents = fs.readFileSync(absolutePath, 'utf8')
    try {
      return JSON.parse(fileContents)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Invalid JSON in ${absolutePath}: ${errorMessage}`)
    }
  }

  getCommandConfig(): CommandConfig[] {
    const absolutePath = path.join(this.configFolderPath, 'commands.json')
    const fileContents = fs.readFileSync(absolutePath, 'utf8')
    try {
      return JSON.parse(fileContents)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Invalid JSON in ${absolutePath}: ${errorMessage}`)
    }
  }

  getIssueOpsConfig(): IssueOpsConfig {
    const absolutePath = path.join(this.configFolderPath, 'issueops.json')
    const fileContents = fs.readFileSync(absolutePath, 'utf8')
    try {
      return JSON.parse(fileContents)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Invalid JSON in ${absolutePath}: ${errorMessage}`)
    }
  }

  getCustomConfig(environment?: string): Record<string, unknown> {
    try {
      const commonCustomConfigPath = path.join(
        this.configFolderPath,
        'custom-config.json'
      )
      const environmentCustomConfigPath = path.join(
        this.configFolderPath,
        `custom-config-${environment}.json`
      )

      let result: Record<string, unknown> = {}

      if (fs.existsSync(commonCustomConfigPath)) {
        const commonCustomConfig = fs.readFileSync(
          commonCustomConfigPath,
          'utf8'
        )
        try {
          result = JSON.parse(commonCustomConfig)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          throw new Error(
            `Invalid JSON in ${commonCustomConfigPath}: ${errorMessage}`
          )
        }
      }

      if (environment && fs.existsSync(environmentCustomConfigPath)) {
        const environmentCustomConfig = fs.readFileSync(
          environmentCustomConfigPath,
          'utf8'
        )
        try {
          const envConfig = JSON.parse(environmentCustomConfig)
          result = Object.assign(result, envConfig)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          throw new Error(
            `Invalid JSON in ${environmentCustomConfigPath}: ${errorMessage}`
          )
        }
      }

      return result
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      throw new Error(
        `Failed to read custom config for environment '${environment}'. ` +
          `Checked paths: custom-config.json, custom-config-${environment}.json. ` +
          `Error: ${errorMessage}`
      )
    }
  }

  getMatrixField(): string | null {
    const config = this.getFieldConfig()
    const matrixFields = config
      .filter(value => value.matrix === true)
      .map(value => value.name)

    if (matrixFields.length > 1) {
      throw new MultipleMatrixFieldsError('Multiple matrix fields found')
    }

    return matrixFields.length ? matrixFields[0] : null
  }
}
