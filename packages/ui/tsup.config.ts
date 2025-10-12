import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx', 'src/styles.css'],
  format: ['esm'],
  dts: false, // Disable DTS generation for faster builds (types still work via tsconfig)
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  splitting: false,
  treeshake: true,
});
