# ⚔️ Web Sword Cursor

一个用于植入型替换网页鼠标指针的 JavaScript 库，支持运动方向显示。

## ✨ 特性

- 🎯 自定义剑形鼠标指针
- 🔄 根据移动方向自动旋转（剑默认方向：从左下到右上 ↗）
- ✨ 动态剑尖光晕效果：
  - 自动渲染 SVG 滤镜光晕
  - 光的方向与剑身相反，创造剑气外放效果
  - 平滑跟随剑的旋转
  - 🚀 **根据鼠标速度动态变化**：速度快时光晕更大更亮，速度慢时光晕更小
- 🎬 平滑的旋转动画：
  - 使用 requestAnimationFrame 实现丝滑的插值动画
  - 大角度变化时自动使用快速翻转效果
  - 始终选择最短的旋转路径
- ⚡ 智能角度阈值，避免抖动（≥3° 才更新）
- 📦 纯 JavaScript，无依赖
- 🎨 灵活的图标系统：内置默认剑、支持自定义 SVG 字符串或 DOM 元素
- 🔧 灵活的配置选项
- 📱 支持 ES Module、UMD 和 IIFE 格式

## 📦 安装

```bash
npm install web-sword-cursor
# 或
pnpm add web-sword-cursor
# 或
yarn add web-sword-cursor
```

## 🚀 使用方法

### 基础使用

```javascript
import { initSwordCursor } from 'web-sword-cursor';

// 1. 快速启用（使用内置默认剑）
initSwordCursor();

// 2. 从外部文件加载 SVG
fetch('/path/to/your-sword.svg')
  .then(response => response.text())
  .then(svgString => {
    initSwordCursor({ swordItem: svgString });
  });

// 3. 传入自定义 SVG 字符串
const customSvg = `<svg viewBox="0 0 100 100">...</svg>`;
initSwordCursor({ swordItem: customSvg });

// 4. 传入 SVG DOM 元素
const svgElement = document.querySelector('#my-sword-svg');
initSwordCursor({ swordItem: svgElement });
```

### 高级使用

```javascript
import { CursorManager } from 'web-sword-cursor';

// 创建实例并配置
const manager = new CursorManager({
  size: 32,                    // 指针大小（像素）
  showDirection: true,         // 显示运动方向
  directionSensitivity: 50,    // 方向更新灵敏度（毫秒）
  zIndex: 9999,                // 自定义 z-index
  swordItem: customSvg         // 自定义 SVG（字符串或 DOM），不传则使用内置默认
});

// 启用
manager.init();

// 获取当前移动方向
console.log(manager.getCurrentDirection());

// 获取当前速度（像素/秒）
console.log(manager.getCurrentSpeed()); // 例如：1250

// 更新配置
manager.updateOptions({ size: 48 });

// 禁用
manager.destroy();
```

### 在 HTML 中使用（IIFE）

```html
<script src="https://unpkg.com/web-sword-cursor/dist/web-sword-cursor.iife.js"></script>
<script>
  WebSwordCursor.initSwordCursor();
</script>
```

## 🎛️ API

### `initSwordCursor(options?: CursorOptions): CursorManager`

快速初始化函数，创建并启用剑形指针。

### `CursorManager`

主要类，用于管理自定义指针。

#### 构造函数

```typescript
constructor(options?: CursorOptions)
```

#### 方法

- `init(): void` - 初始化并启用自定义鼠标指针
- `destroy(): void` - 销毁并恢复默认鼠标指针
- `getCurrentDirection(): Direction` - 获取当前移动方向
- `getCurrentSpeed(): number` - 获取当前速度（像素/秒）
- `updateOptions(options: Partial<CursorOptions>): void` - 更新配置

### 类型定义

```typescript
interface CursorOptions {
  size?: number;                    // 指针大小（像素），默认 32
  showDirection?: boolean;          // 是否显示运动方向，默认 true
  directionSensitivity?: number;    // 方向更新灵敏度（毫秒），默认 50
  zIndex?: number;                  // 自定义 z-index，默认 9999
  swordItem?: string | SVGElement;  // 自定义 SVG（字符串或 DOM），不传则使用内置默认
}

type Direction = 
  | 'up' 
  | 'down' 
  | 'left' 
  | 'right' 
  | 'up-left' 
  | 'up-right' 
  | 'down-left' 
  | 'down-right' 
  | 'idle';
```

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 开发模式（启动开发服务器）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check
```

## 📐 自定义 SVG 要求

当使用自定义 SVG 时，请遵循以下要求：

### 方向约定
- **默认方向**：从左下到右上（↗），即 -45 度（或 315 度）方向
- 这样可以确保图标在旋转时表现一致
- 详细的角度计算说明请参考 [docs/ANGLE_CALCULATION.md](docs/ANGLE_CALCULATION.md)

### SVG 格式
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- 确保有 viewBox 属性以便正确缩放 -->
  <!-- SVG 内容... -->
</svg>
```

### 示例：自定义箭头
```javascript
const arrowSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path d="M 10,10 L 90,50 L 10,90 L 30,50 Z" 
          fill="red" stroke="#fff" stroke-width="2"/>
  </svg>
`;

initSwordCursor({ swordItem: arrowSvg });
```

## 📝 许可证

MIT License

## 🤝 贡献

欢迎 Pull Requests 和 Issues！

