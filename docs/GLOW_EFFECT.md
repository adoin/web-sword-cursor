# 剑尖光晕效果

## 概述

剑尖会自动渲染一个动态光晕效果，光的方向始终与剑身方向相反，创造出剑气外放的视觉效果。

## 效果说明

### 光晕特性

1. **位置**：光晕始终在剑尖位置（SVG 的右上角，即旋转中心）
2. **方向**：光的方向与剑身方向相反（旋转 180°）
3. **形状**：椭圆形光晕，沿着剑尖方向延伸
4. **颜色**：白色径向渐变，从中心向外逐渐透明
5. **动态**：随着剑的旋转自动更新方向

### 视觉效果

```
剑身方向：→
光晕方向：← （相反）

剑身方向：↗
光晕方向：↙ （相反）
```

## 技术实现

### SVG 滤镜

使用 SVG 原生滤镜创建光晕效果：

```xml
<filter id="sword-tip-glow">
  <!-- 高斯模糊 -->
  <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
  
  <!-- 颜色矩阵（创建白色光晕）-->
  <feColorMatrix in="blur" type="matrix" 
                 values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
                 result="glow"/>
  
  <!-- 合并原图和光晕 -->
  <feMerge>
    <feMergeNode in="glow"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
```

### 径向渐变

```xml
<radialGradient id="sword-tip-light">
  <stop offset="0%" style="stop-color:rgba(255,255,255,0.9)"/>
  <stop offset="50%" style="stop-color:rgba(255,255,255,0.5)"/>
  <stop offset="100%" style="stop-color:rgba(255,255,255,0)"/>
</radialGradient>
```

### 光晕元素

```xml
<ellipse id="tip-glow-element"
         cx="100%" cy="0%"        <!-- 剑尖位置 -->
         rx="20%" ry="30%"        <!-- 椭圆形 -->
         fill="url(#sword-tip-light)"
         filter="url(#sword-tip-glow)"
         opacity="0.8"/>
```

## 代码实现

### 创建光晕

在 `createCursorElement()` 方法中自动添加光晕：

```typescript
private addSwordTipGlow(svgElement: SVGSVGElement): void {
  // 1. 创建滤镜定义
  // 2. 创建径向渐变
  // 3. 创建光晕元素并添加到 SVG
}
```

### 更新光晕方向

在动画循环中实时更新：

```typescript
private updateGlowDirection(): void {
  const glowElement = this.cursorElement.querySelector('#tip-glow-element');
  if (glowElement) {
    // 光的方向与剑身方向相反
    const glowAngle = this.currentAngle + 180;
    glowElement.style.transform = `rotate(${glowAngle}deg)`;
  }
}

private animateRotation = (): void => {
  // ... 更新剑的旋转角度
  
  // 更新光晕方向
  this.updateGlowDirection();
  
  // 继续动画
  requestAnimationFrame(this.animateRotation);
};
```

## 参数调整

可以通过修改以下参数来调整光晕效果：

### 光晕大小

```typescript
glowCircle.setAttribute('rx', '20%');  // 水平半径
glowCircle.setAttribute('ry', '30%');  // 垂直半径（椭圆）
```

### 光晕透明度

```typescript
glowCircle.setAttribute('opacity', '0.8');  // 整体透明度
```

### 模糊程度

```typescript
feGaussianBlur.setAttribute('stdDeviation', '3');  // 模糊半径
```

### 光晕颜色

修改径向渐变的颜色：

```typescript
// 白色光晕
stop1.setAttribute('style', 'stop-color:rgba(255,255,255,0.9)');

// 黄色光晕（如火焰效果）
stop1.setAttribute('style', 'stop-color:rgba(255,220,100,0.9)');

// 蓝色光晕（如冰霜效果）
stop1.setAttribute('style', 'stop-color:rgba(100,200,255,0.9)');
```

## 性能考虑

1. **SVG 滤镜性能**：滤镜在 GPU 上渲染，性能良好
2. **动画更新**：使用 requestAnimationFrame 优化
3. **DOM 操作**：光晕只创建一次，后续只更新 transform
4. **浏览器兼容性**：现代浏览器均支持 SVG 滤镜

## 自定义光晕

### 示例：添加多色光晕

```typescript
// 修改渐变为彩虹色
const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
stop1.setAttribute('offset', '0%');
stop1.setAttribute('style', 'stop-color:rgba(255,100,100,0.9)');

const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
stop2.setAttribute('offset', '50%');
stop2.setAttribute('style', 'stop-color:rgba(100,100,255,0.5)');
```

### 示例：添加脉动效果

```typescript
// 在 updateGlowDirection 中添加
const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8; // 0.6 - 1.0
glowElement.setAttribute('opacity', pulse.toString());
```

### 示例：添加闪烁效果

```typescript
// 随机闪烁
if (Math.random() > 0.95) {
  glowElement.setAttribute('opacity', '1');
  setTimeout(() => {
    glowElement.setAttribute('opacity', '0.8');
  }, 100);
}
```

## 未来改进

可能的增强功能：
- 配置选项控制光晕开关
- 支持自定义光晕颜色
- 支持多种光晕效果（火焰、冰霜、闪电等）
- 添加粒子效果
- 根据移动速度调整光晕强度

