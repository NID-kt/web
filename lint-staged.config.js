module.exports = {
  '*.{js,jsx,ts,tsx}': [
    () => 'pnpm format',
    () => 'tsc -p tsconfig.json --noEmit',
  ],
};
