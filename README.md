# ⚔️ Web Sword Cursor

一个用于植入型替换网页鼠标指针的 JavaScript 库，支持运动方向显示。

## ✨ 特性

- 🎯 自定义剑形鼠标指针
- 🔄 根据移动方向自动旋转（剑默认方向：从左下到右上 ↗）
- ⚡ 智能角度阈值，避免抖动（≥3° 才更新）
- 📦 纯 JavaScript，无依赖
- 🎨 SVG 内嵌，无需额外资源文件
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

// 快速启用
initSwordCursor();
```

### 高级使用

```javascript
import { CursorManager } from 'web-sword-cursor';

// 创建实例并配置
const manager = new CursorManager({
  size: 32,                    // 指针大小（像素）
  showDirection: true,         // 显示运动方向
  directionSensitivity: 50,    // 方向更新灵敏度（毫秒）
  zIndex: 9999                 // 自定义 z-index
});

// 启用
manager.init();

// 获取当前移动方向
console.log(manager.getCurrentDirection());

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
- `updateOptions(options: Partial<CursorOptions>): void` - 更新配置

### 类型定义

```typescript
interface CursorOptions {
  size?: number;                  // 指针大小（像素），默认 32
  showDirection?: boolean;        // 是否显示运动方向，默认 true
  directionSensitivity?: number;  // 方向更新灵敏度（毫秒），默认 50
  zIndex?: number;                // 自定义 z-index，默认 9999
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

## 📐 SVG 方向约定

所有的剑形 SVG 图标都应该遵循以下方向约定：
- **默认方向**：从左下到右上（↗），即 -45 度（或 315 度）方向
- 这样可以确保所有图标在旋转时表现一致
- 详细的角度计算说明请参考 [docs/ANGLE_CALCULATION.md](docs/ANGLE_CALCULATION.md)

## 📝 许可证

MIT License

## 🤝 贡献

欢迎 Pull Requests 和 Issues！

