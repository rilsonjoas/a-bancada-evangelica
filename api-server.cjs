// Bootstrap CJS para NestJS — necessário porque package.json tem "type": "module"
// mas emitDecoratorMetadata só funciona em modo CommonJS.
// Arquivos .cjs são sempre tratados como CommonJS independente do "type".
require('tsconfig-paths/register');
require('ts-node').register({ project: './tsconfig.api.json', transpileOnly: true });
require('./src/api/main.ts');
