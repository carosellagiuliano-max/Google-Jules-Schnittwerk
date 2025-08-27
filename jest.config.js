/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Handle module aliases (this will need to be configured in tsconfig.json as well)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/tests/**/*.test.ts',
  ],
  // Optional: Setup files to run before each test file
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
