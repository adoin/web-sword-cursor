# 文档目录

本目录包含 Web Sword Cursor 项目的详细技术文档。

## 文档列表

### [ANGLE_CALCULATION.md](./ANGLE_CALCULATION.md)
角度计算详细说明文档，包括：
- 剑的默认方向约定（从左下到右上 ↗）
- 角度转换逻辑
- 角度变化阈值机制（3° 阈值避免抖动）
- 各个方向的角度对应关系
- 代码实现示例

## 添加新的 SVG 图标

当你需要添加新的剑形 SVG 图标时，请遵循以下步骤：

### 1. 方向约定
确保你的 SVG 图标的**默认方向是从左下到右上（↗）**，即 -135° 或 45° 方向。

### 2. 放置文件
将 SVG 文件放到 `src/assets/svgs/` 目录下，例如：
```
src/assets/svgs/
├── sword-1.svg  (已有)
└── sword-2.svg  (新增)
```

### 3. 导入 SVG
在 `src/cursor-manager.ts` 中导入新的 SVG：
```typescript
import sword1Svg from './assets/svgs/sword-1.svg';
import sword2Svg from './assets/svgs/sword-2.svg'; // 新增
```

### 4. 注册到 Map
在 `svgData` Map 中注册：
```typescript
private svgData: Map<string, string> = new Map([
  ['sword-1', sword1Svg],
  ['sword-2', sword2Svg], // 新增
]);
```

### 5. 使用
可以在 `createCursorElement()` 方法中切换使用不同的剑：
```typescript
const svgContent = this.svgData.get('sword-2') || '';
```

## 技术架构

### 核心组件

1. **CursorManager** (`src/cursor-manager.ts`)
   - 主要管理类
   - 处理鼠标事件
   - 计算角度和方向
   - 更新 DOM

2. **类型定义** (`src/types.ts`)
   - TypeScript 类型声明
   - 接口定义

3. **Vite 配置** (`vite.config.ts`)
   - 自定义 SVG 文本加载插件
   - 构建配置（ES/UMD/IIFE）

### 工作原理

1. 监听 `mousemove` 事件
2. 计算鼠标移动的角度（使用 `Math.atan2`）
3. 将角度转换为相对于剑默认方向的旋转角度
4. 应用 3° 阈值过滤，避免小幅度抖动
5. 通过 CSS `transform: rotate()` 旋转指针元素

## 性能优化

1. **角度阈值**：小于 3° 的变化不会触发更新
2. **时间节流**：通过 `directionSensitivity` 控制更新频率
3. **CSS 过渡**：使用 `transition` 实现平滑旋转
4. **移动距离检测**：移动距离小于 2px 时认为是静止状态

