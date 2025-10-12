import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx', 'src/styles.css'],
  format: ['esm'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@ai-cleanup/types'],
  splitting: false,
  treeshake: true,
  skipNodeModulesBundle: true,
});
