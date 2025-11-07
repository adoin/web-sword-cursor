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

export default defineConfig(({ command }) => {
  const isLib = process.env.BUILD_LIB === 'true';
  
  if (isLib) {
    // 库构建模式
    return {
      plugins: [svgLoader()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'WebSwordCursor',
          fileName: (format) => `web-sword-cursor.${format}.js`,
          formats: ['es', 'umd', 'iife']
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
          }
        },
        minify: 'esbuild',
        sourcemap: true
      }
    };
  }
  
  // 示例页面构建模式（GitHub Pages）
  return {
    base: command === 'serve' ? '/' : '/web-sword-cursor/',
    plugins: [svgLoader()],
    server: {
      port: 3111,
    },
    build: {
      outDir: 'dist',
      minify: 'esbuild',
      sourcemap: true
    }
  };
});

