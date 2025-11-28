export abstract class WarningError extends Error {}

export class IssueLabelAlreadyAssignedError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'IssueLabelAlreadyAssignedError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IssueLabelAlreadyAssignedError)
    }
  }
}

export class InvalidCommandError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCommandError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidCommandError)
    }
  }
}

export class MultipleMatrixFieldsError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'MultipleMatrixFieldsError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MultipleMatrixFieldsError)
    }
  }
}

export class RegexValidationError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'RegexValidationError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RegexValidationError)
    }
  }
}

export class MissingRequiredValueError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'MissingRequiredValueError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingRequiredValueError)
    }
  }
}

export class CommandAdditionalValuesError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'CommandAdditionalValuesError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CommandAdditionalValuesError)
    }
  }
}

export class MissingColumnConfigurationError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'MissingColumnConfigurationError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingColumnConfigurationError)
    }
  }
}

export class MissingMarkdownAttributeError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'MissingMarkdownAttributeError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingMarkdownAttributeError)
    }
  }
}

export class JobNotFoundError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'JobNotFoundError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JobNotFoundError)
    }
  }
}

export class JobIsolationError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'JobIsolationError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JobIsolationError)
    }
  }
}
