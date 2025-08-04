const { defineConfig } = require('eslint/config');
const expoConfig    = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        // premièrement, résolution Node classique
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript : {
          alwaysTryTypes:true,
        },
        // puis, respect de l’alias @env défini par Babel
        'babel-module': {}
      }
    }
  }
]);
