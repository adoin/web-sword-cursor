/// <reference types="vite/client" />

// SVG 模块声明
declare module '*.svg' {
  const content: string;
  export default content;
}

