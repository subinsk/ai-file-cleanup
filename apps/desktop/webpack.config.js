const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'electron-main',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    main: './electron/main.ts',
    preload: './electron/preload.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist/electron'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@ai-cleanup/types': path.resolve(__dirname, '../../packages/types/dist'),
      '@ai-cleanup/core': path.resolve(__dirname, '../../packages/core/dist'),
      '@ai-cleanup/ui': path.resolve(__dirname, '../../packages/ui/dist'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.electron.json',
          },
        },
      },
    ],
  },
  externals: {
    // Externalize electron and native modules that should not be bundled
    electron: 'commonjs2 electron',
    // fsevents is a macOS-specific optional dependency
    fsevents: 'commonjs2 fsevents',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
          to: '.env',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  devtool: 'source-map',
};
