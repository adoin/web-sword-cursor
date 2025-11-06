# 剑类型系统

## 概述

Web Sword Cursor 支持多种剑形图标，用户可以通过 `swordType` 参数选择使用哪一把剑。

## 可用的剑

### sword-1（默认）
- 经典的剑形设计
- 默认值，如果不指定 `swordType` 则使用此剑
- SVG 文件：`src/assets/svgs/sword-1.svg`

### sword-2
- 第二把剑的设计
- SVG 文件：`src/assets/svgs/sword-2.svg`

## 使用方法

### 方法 1：使用 initSwordCursor

```typescript
import { initSwordCursor } from 'web-sword-cursor';

// 使用默认剑（sword-1）
initSwordCursor();

// 选择 sword-2
initSwordCursor({ swordType: 'sword-2' });
```

### 方法 2：使用 CursorManager

```typescript
import { CursorManager } from 'web-sword-cursor';

const manager = new CursorManager({
  swordType: 'sword-2',
  size: 32
});

manager.init();
```

### 方法 3：在运行时切换剑

要在运行时切换剑类型，需要销毁当前实例并创建新实例：

```typescript
// 销毁当前实例
if (manager) {
  manager.destroy();
}

// 创建新实例使用不同的剑
manager = new CursorManager({ swordType: 'sword-2' });
manager.init();
```

**注意**：`updateOptions()` 方法不支持更新 `swordType`，因为 SVG 内容在初始化时已经设置。

## 类型定义

```typescript
// 剑类型枚举
export type SwordType = 'sword-1' | 'sword-2';

// 配置选项
export interface CursorOptions {
  // ... 其他选项
  swordType?: SwordType;  // 默认：'sword-1'
}
```

## 添加新的剑类型

详细步骤请参考 [docs/README.md](./README.md#添加新的-svg-图标)

简要流程：
1. 准备 SVG 文件（方向：从左下到右上 ↗）
2. 放到 `src/assets/svgs/` 目录
3. 更新 `src/types.ts` 中的 `SwordType` 类型
4. 在 `src/cursor-manager.ts` 中导入并注册
5. 使用新的剑类型

## SVG 要求

所有的剑形 SVG 必须满足以下要求：

1. **方向约定**：默认方向必须是从左下到右上（↗），即 -45° 或 315°
2. **旋转中心**：系统会将 SVG 的右上角作为旋转中心（剑尖位置）
3. **尺寸**：SVG 会自动缩放到指定的 `size`，建议原始尺寸为正方形
4. **格式**：标准的 SVG 格式，可以包含内联样式

## 示例：演示页面中的剑切换

在 `index.html` 演示页面中，你可以看到完整的剑切换实现：

```javascript
let currentSwordType = 'sword-1';

function initOrReinitCursor(options = {}) {
  if (cursorManager) {
    cursorManager.destroy();
  }
  
  cursorManager = initSwordCursor({ 
    size: 32, 
    swordType: currentSwordType,
    ...options 
  });
}

// 切换到剑 1
document.getElementById('sword1Btn').addEventListener('click', () => {
  currentSwordType = 'sword-1';
  if (cursorManager) {
    initOrReinitCursor();
  }
});

// 切换到剑 2
document.getElementById('sword2Btn').addEventListener('click', () => {
  currentSwordType = 'sword-2';
  if (cursorManager) {
    initOrReinitCursor();
  }
});
```

## 最佳实践

1. **选择合适的剑**：根据你的网站风格选择合适的剑类型
2. **保持一致性**：在同一个页面中避免频繁切换剑类型
3. **测试方向**：确保新添加的剑 SVG 方向正确（-45°）
4. **优化大小**：根据实际使用场景调整 `size` 参数
5. **性能考虑**：SVG 文件会被内嵌到 JS bundle 中，注意文件大小

## 未来扩展

可能的未来功能：
- 动态加载剑 SVG（不内嵌到 bundle）
- 支持用户自定义 SVG URL
- 支持 `updateOptions()` 热切换剑类型
- 剑的动画效果（如挥舞、闪光等）

