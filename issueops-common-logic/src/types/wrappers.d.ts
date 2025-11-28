export interface ActionsCoreWrapper {
  setFailed(message: string): unknown
  getInput: (name: string) => string
  setOutput: (name: string, value: string) => void
  debug: (message: string) => void
}
