module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@actions/glob$': '<rootDir>/node_modules/@actions/glob/lib/glob.js'
  },
  transformIgnorePatterns: ['/node_modules/(?!@actions/glob)'],
  verbose: true,
  testEnvironment: 'node'
}
