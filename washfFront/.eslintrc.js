module.exports = {
  root: true,
  extends: [
    'universe/native',        // si tu utilises Expo
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  settings: {
    'import/resolver': {
      // <-- voici la partie essentielle
      typescript: {
        // point vers ton tsconfig
        project: './tsconfig.json'
      }
    }
  },
  rules: {
    // tes règles perso…
  }
};
