const path = require('path');

module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        extensions: ['.js', '.ts'],
        alias: { '~': path.resolve(__dirname, 'src') },
      },
    ],
    '@babel/plugin-transform-runtime',
  ],
};
