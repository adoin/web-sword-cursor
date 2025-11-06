# 平滑旋转优化

## 问题背景

在初始版本中，当鼠标快速改变方向时（比如从向右突然变为向左），剑会直接旋转到新角度，导致视觉上的"暴力"跳转效果，体验不够流畅。

## 解决方案

### 1. 使用 requestAnimationFrame 替代 CSS transition

**之前**：
```typescript
// CSS transition
transition: transform 0.05s ease-out;

// 直接更新角度
this.cursorElement.style.transform = `rotate(${angle}deg)`;
```

**现在**：
```typescript
// 移除 CSS transition，使用 requestAnimationFrame
private animateRotation = (): void => {
  // 平滑插值逻辑
  requestAnimationFrame(this.animateRotation);
};
```

**优势**：
- 更精确的控制：每一帧都可以自定义插值逻辑
- 更高的性能：与浏览器刷新率同步（60fps）
- 更灵活：可以根据角度差异使用不同的插值策略

### 2. 角度插值（Lerp）

使用线性插值（Linear Interpolation）平滑地从当前角度过渡到目标角度：

```typescript
// 当前角度逐步靠近目标角度
this.currentAngle += angleDiff * this.ANGLE_LERP_SPEED;
```

- `ANGLE_LERP_SPEED = 0.2`：插值速度（0-1 之间）
- 数值越小，动画越慢但越平滑
- 数值越大，动画越快但可能出现抖动

### 3. 大角度翻转优化

当角度变化超过 90 度时，使用更快的插值速度，创造"翻转"效果：

```typescript
if (Math.abs(angleDiff) > this.LARGE_ANGLE_THRESHOLD) {
  // 大角度变化：快速翻转（插值速度 0.5）
  this.currentAngle += angleDiff * 0.5;
} else {
  // 小角度变化：平滑过渡（插值速度 0.2）
  this.currentAngle += angleDiff * this.ANGLE_LERP_SPEED;
}
```

### 4. 角度标准化

确保角度差始终在 -180° 到 180° 范围内，选择最短的旋转路径：

```typescript
private normalizeAngleDiff(diff: number): number {
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}
```

**示例**：
- 从 10° 旋转到 350°
- 不标准化：旋转 340°（顺时针）
- 标准化后：旋转 -20°（逆时针，更短）

## 性能优化

### 节流机制

保留了原有的时间节流机制（`directionSensitivity`），避免过于频繁地计算目标角度：

```typescript
if (now - this.lastUpdateTime > this.options.directionSensitivity) {
  this.updateDirection(currentPosition);
  this.lastUpdateTime = now;
}
```

### 小角度阈值

当角度变化小于 3° 时，不更新目标角度，避免微小抖动：

```typescript
if (Math.abs(angleDiff) < this.ANGLE_THRESHOLD) {
  return; // 不更新
}
```

## 配置参数

| 参数 | 默认值 | 说明 |
|-----|-------|------|
| `ANGLE_THRESHOLD` | 3° | 小于此值的角度变化会被忽略 |
| `LARGE_ANGLE_THRESHOLD` | 90° | 大于此值的角度变化会使用快速翻转 |
| `ANGLE_LERP_SPEED` | 0.2 | 小角度变化的插值速度（0-1） |
| 大角度插值速度 | 0.5 | 大角度翻转的插值速度（硬编码） |
| `directionSensitivity` | 50ms | 方向更新的时间节流间隔 |

## 效果对比

### 之前（CSS Transition）
- ❌ 大角度旋转时出现"暴力"跳转
- ❌ 无法区分大小角度变化
- ❌ 固定的动画速度

### 现在（requestAnimationFrame + Lerp）
- ✅ 小角度变化：平滑过渡（慢速）
- ✅ 大角度变化：快速翻转（中速）
- ✅ 选择最短旋转路径
- ✅ 丝滑的视觉体验

## 未来改进方向

1. **弹簧动画**：使用弹簧物理模型（Spring Physics）代替线性插值
2. **可配置参数**：将插值速度等参数暴露给用户配置
3. **缓动函数**：支持不同的缓动曲线（ease-in、ease-out 等）
4. **惯性效果**：添加角速度概念，让旋转更有物理感

