import { CommandConfig } from './types/config.d'
import {
  CommandAdditionalValuesError,
  InvalidCommandError
} from './types/errors'
import { CommandOutput } from './types/types.d'

/**
 * Parses a command from a comment and returns the corresponding command output.
 * @param comment The comment string.
 * @param commandConfig The array of command configurations.
 * @returns The command output object.
 * @throws {CommandAdditionalValuesError} If the command is not valid and has incorrect additional values.
 * @throws {InvalidCommandError} If the command is not valid and is not recognized.
 */
export function parseCommandFromComment(
  comment: string,
  commandConfig: CommandConfig[]
): CommandOutput {
  if (!comment.startsWith('/')) {
    return { command: '', additionalValues: {}, skip: true } as CommandOutput
  }

  const command = commandConfig.find(c =>
    comment.toLowerCase().match(`^(/${c.command.toLowerCase()})( |$)`)
  )
  if (command) {
    const regex = /(?:[^\s"]+|"[^"]*")+/g
    const matches = comment.match(regex) || []
    const additionalValues = matches
      .slice(1)
      .map(value =>
        value.startsWith('"') && value.endsWith('"')
          ? value.slice(1, -1).replace(/\\(.)/g, '$1')
          : value
      )

    let additionalValuesObject = {}

    if (command.additionalParams) {
      if (additionalValues.length !== command.additionalParams.length) {
        throw new CommandAdditionalValuesError(
          `Command is not valid, expected ${
            command.additionalParams.length
          } additional values but got ${
            additionalValues.length
          }. Expected Parameters: ${command.additionalParams.join(', ')}.`
        )
      }
      additionalValuesObject = additionalValues.reduce(
        (obj, value, index) => {
          const key = command.additionalParams?.[index]
          if (key) {
            obj[key] = value
          }
          return obj
        },
        {} as { [key: string]: string }
      )
    }

    return {
      command: command.command,
      additionalValues: additionalValuesObject,
      skip: false,
      environment: command.environment,
      report: command.report
    }
  }
  const availableCommands = commandConfig
    .map(c => `\`${c.command}\``)
    .join(', ')
  throw new InvalidCommandError(
    `Command is not valid, available command(s): ${availableCommands}`
  )
}
