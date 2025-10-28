import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  
  // 预览服务器配置
  preview: {
    port: 4173,
    host: true,
    cors: true,
  },
  
  // 构建配置
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: {
          // 将 React 相关库打包到一个 chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将 Redux 相关库打包到一个 chunk
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          // 将 Ant Design 打包到一个 chunk
          'antd-vendor': ['antd', '@ant-design/icons'],
          // 将工具库打包到一个 chunk
          'utils-vendor': ['dayjs', 'axios', 'lodash-es'],
        },
      },
    },
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
  },
  
  // CSS 配置
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          // Ant Design 主题定制
          '@primary-color': '#1890ff',
          '@link-color': '#1890ff',
          '@success-color': '#52c41a',
          '@warning-color': '#faad14',
          '@error-color': '#ff4d4f',
          '@font-size-base': '14px',
          '@heading-color': 'rgba(0, 0, 0, 0.85)',
          '@text-color': 'rgba(0, 0, 0, 0.65)',
          '@text-color-secondary': 'rgba(0, 0, 0, 0.45)',
          '@disabled-color': 'rgba(0, 0, 0, 0.25)',
          '@border-radius-base': '6px',
          '@border-color-base': '#d9d9d9',
          '@box-shadow-base': '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    modules: {
      localsConvention: 'camelCase',
    },
  },
  
  // 依赖优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'redux-persist',
      'antd',
      '@ant-design/icons',
      'dayjs',
      'axios',
      'lodash-es',
    ],
  },
  
  // 环境变量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // ESBuild 配置
  esbuild: {
    drop: ['console', 'debugger'],
  },
  
  // 实验性功能
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` }
      } else {
        return { relative: true }
      }
    },
  },
})