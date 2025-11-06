# 文档目录

本目录包含 Web Sword Cursor 项目的详细技术文档。

## 文档列表

### [ANGLE_CALCULATION.md](./ANGLE_CALCULATION.md)
角度计算详细说明文档，包括：
- 剑的默认方向约定（从左下到右上 ↗）
- 角度转换逻辑
- 角度变化阈值机制（3° 阈值避免抖动）
- 各个方向的角度对应关系
- 旋转中心点设置（右上角）
- 代码实现示例

### [SMOOTH_ROTATION.md](./SMOOTH_ROTATION.md)
平滑旋转优化说明文档，包括：
- 为什么使用 requestAnimationFrame 替代 CSS transition
- 角度插值（Lerp）实现原理
- 大角度翻转优化策略
- 角度标准化（选择最短路径）
- 性能优化措施
- 效果对比和未来改进方向

### [SWORD_TYPES.md](./SWORD_TYPES.md)
剑类型系统说明文档，包括：
- 可用的剑类型列表
- 如何选择和切换剑类型
- 添加新剑类型的完整步骤
- SVG 文件要求和规范
- 最佳实践和示例代码

### [GLOW_EFFECT.md](./GLOW_EFFECT.md)
剑尖光晕效果说明文档，包括：
- 光晕效果的特性和视觉表现
- SVG 滤镜技术实现原理
- 如何自定义光晕颜色和大小
- 添加脉动、闪烁等特效
- 性能优化和浏览器兼容性

## 添加新的 SVG 图标

当你需要添加新的剑形 SVG 图标时，请遵循以下步骤：

### 1. 方向约定
确保你的 SVG 图标的**默认方向是从左下到右上（↗）**，即 -45° 或 315° 方向。

### 2. 放置文件
将 SVG 文件放到 `src/assets/svgs/` 目录下，例如：
```
src/assets/svgs/
├── sword-1.svg  (已有)
├── sword-2.svg  (已有)
└── sword-3.svg  (新增)
```

### 3. 更新类型定义
在 `src/types.ts` 中添加新的剑类型：
```typescript
export type SwordType = 'sword-1' | 'sword-2' | 'sword-3'; // 添加 sword-3
```

### 4. 导入 SVG
在 `src/cursor-manager.ts` 中导入新的 SVG：
```typescript
import sword1Svg from './assets/svgs/sword-1.svg';
import sword2Svg from './assets/svgs/sword-2.svg';
import sword3Svg from './assets/svgs/sword-3.svg'; // 新增
```

### 5. 注册到 Map
在 `svgData` Map 中注册：
```typescript
private svgData: Map<SwordType, string> = new Map([
  ['sword-1', sword1Svg],
  ['sword-2', sword2Svg],
  ['sword-3', sword3Svg], // 新增
]);
```

### 6. 使用
在初始化时选择剑类型：
```typescript
initSwordCursor({ swordType: 'sword-3' });
```

或通过 CursorManager：
```typescript
const manager = new CursorManager({ swordType: 'sword-3' });
manager.init();
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

