import type { ConfigFile } from '@rtk-query/codegen-openapi';

const config: ConfigFile = {
  schemaFile: '../backend/schema.yaml',
  apiFile: './src/services/emptyApi.ts',
  apiImport: 'emptySplitApi',
  outputFile: './src/services/generatedApi.ts',
  exportName: 'generatedApi',
  hooks: true,
};

export default config;
