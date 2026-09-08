import type { Config } from 'jest';
import { createDefaultEsmPreset, pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

// Path aliases (e.g. the ones added by `nest g library`) live in tsconfig.json,
// so they are read from there instead of being duplicated here.
const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  ...createDefaultEsmPreset({
    tsconfig: {
      module: 'ESNext',
      moduleResolution: 'Bundler',
      target: 'ES2023',
      esModuleInterop: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      isolatedModules: true,
      types: ['node', 'jest'],
    },
  }),
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  setupFiles: ['<rootDir>/test/setup-test-env.ts'],
  moduleNameMapper: pathsToModuleNameMapper(paths, {
    prefix: '<rootDir>/',
    useESM: true,
  }),
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
