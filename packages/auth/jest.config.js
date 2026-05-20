module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@massage/types$': '<rootDir>/../types/src/index.ts',
  },
};
