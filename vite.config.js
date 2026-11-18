import { defineConfig } from 'vite';

export default defineConfig({
  // 相对路径，让站点在 GitHub Pages 的项目页子路径（/i-like-food/）下也能正确加载资源
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
