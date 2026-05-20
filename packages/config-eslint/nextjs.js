module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals',
    'prettier',
  ],
  rules: {
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
};
