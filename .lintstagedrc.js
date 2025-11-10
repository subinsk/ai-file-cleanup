module.exports = {
  '*.{ts,tsx,js,jsx}': (filenames) => {
    // Exclude compiled JS files from scripts directory
    const filtered = filenames.filter(
      (f) => !(f.includes('packages/db/scripts/') && f.endsWith('.js'))
    );
    if (filtered.length === 0) return [];
    return [`eslint --fix ${filtered.join(' ')}`, `prettier --write ${filtered.join(' ')}`];
  },
  '*.{json,md,yaml,yml}': ['prettier --write'],
};
