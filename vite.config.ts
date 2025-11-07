import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, readFileSync } from 'fs';

// 插件：读取所有 SVG 文件为文本
function svgLoader() {
  return {
    name: 'svg-text-loader',
    transform(code: string, id: string) {
      if (id.endsWith('.svg')) {
        // 读取 SVG 文件内容为文本
        const svgContent = readFileSync(id, 'utf-8');
        return {
          code: `export default ${JSON.stringify(svgContent)}`,
          map: null
        };
      }
    }
  };
}

export default defineConfig({
  // GitHub Pages 需要设置 base 为仓库名
  // 开发环境使用 '/', 生产环境使用 '/web-sword-cursor/'
  base: process.env.NODE_ENV === 'production' ? '/web-sword-cursor/' : '/',
  plugins: [svgLoader()],
  server: {
    port: 3111,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebSwordCursor',
      fileName: (format) => `web-sword-cursor.${format}.js`,
      formats: ['es', 'umd', 'iife']
    },
    rollupOptions: {
      output: {
        // 确保所有代码都打包到一个文件中
        inlineDynamicImports: true,
      }
    },
    minify: 'esbuild',
    sourcemap: true
  }
});

