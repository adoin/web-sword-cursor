import { CursorOptions, Direction, Position, SwordType } from './types';
import sword1Svg from './assets/svgs/sword-1.svg';
import sword2Svg from './assets/svgs/sword-2.svg';

/**
 * 鼠标指针管理器
 */
export class CursorManager {
  private options: Required<CursorOptions>;
  private cursorElement: HTMLElement | null = null;
  private lastPosition: Position = { x: 0, y: 0 };
  private currentDirection: Direction = 'idle';
  private lastUpdateTime: number = 0;
  private isActive: boolean = false;
  private currentAngle: number = -45; // 默认角度：从左下到右上（↗）在标准坐标系中是 -45度
  private targetAngle: number = -45; // 目标角度
  private readonly ANGLE_THRESHOLD: number = 3; // 角度变化阈值（度）
  private readonly LARGE_ANGLE_THRESHOLD: number = 90; // 大角度变化阈值（度）
  private animationFrameId: number | null = null; // 动画帧ID
  private readonly ANGLE_LERP_SPEED: number = 0.2; // 角度插值速度（0-1）

  // SVG 数据（内嵌到代码中）
  private svgData: Map<SwordType, string> = new Map([
    ['sword-1', sword1Svg],
    ['sword-2', sword2Svg]
  ]);

  constructor(options: CursorOptions = {}) {
    this.options = {
      size: options.size ?? 32,
      showDirection: options.showDirection ?? true,
      directionSensitivity: options.directionSensitivity ?? 50,
      zIndex: options.zIndex ?? 9999,
      swordType: options.swordType ?? 'sword-1'
    };
  }

  /**
   * 初始化并启用自定义鼠标指针
   */
  public init(): void {
    if (this.isActive) {
      console.warn('CursorManager is already active');
      return;
    }

    // 隐藏默认鼠标指针
    this.hideDefaultCursor();

    // 创建自定义指针元素
    this.createCursorElement();

    // 添加事件监听
    this.addEventListeners();

    // 启动平滑动画循环
    this.startAnimationLoop();

    this.isActive = true;
  }

  /**
   * 销毁并恢复默认鼠标指针
   */
  public destroy(): void {
    if (!this.isActive) return;

    this.stopAnimationLoop();
    this.removeEventListeners();
    this.removeCursorElement();
    this.restoreDefaultCursor();

    this.isActive = false;
  }

  /**
   * 隐藏默认鼠标指针
   */
  private hideDefaultCursor(): void {
    const style = document.createElement('style');
    style.id = 'web-sword-cursor-style';
    style.textContent = `
      * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 恢复默认鼠标指针
   */
  private restoreDefaultCursor(): void {
    const style = document.getElementById('web-sword-cursor-style');
    if (style) {
      style.remove();
    }
  }

  /**
   * 创建自定义指针元素
   */
  private createCursorElement(): void {
    this.cursorElement = document.createElement('div');
    this.cursorElement.id = 'web-sword-cursor';
    this.cursorElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: ${this.options.size}px;
      height: ${this.options.size}px;
      pointer-events: none;
      z-index: ${this.options.zIndex};
      transform-origin: 100% 0%;
      transform: translate(-100%, 0%) rotate(${this.currentAngle}deg);
    `;

    // 设置 SVG 内容
    const svgContent = this.svgData.get(this.options.swordType) || '';
    this.cursorElement.innerHTML = svgContent;

    // 确保 SVG 填充整个容器
    const svgElement = this.cursorElement.querySelector('svg');
    if (svgElement) {
      svgElement.style.width = '100%';
      svgElement.style.height = '100%';
      
      // 添加剑尖光晕效果
      this.addSwordTipGlow(svgElement);
    }

    document.body.appendChild(this.cursorElement);
  }

  /**
   * 添加剑尖光晕效果
   */
  private addSwordTipGlow(svgElement: SVGSVGElement): void {
    // 创建 defs 元素（如果不存在）
    let defs = svgElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgElement.insertBefore(defs, svgElement.firstChild);
    }

    // 创建径向渐变滤镜
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'sword-tip-glow');
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');

    // 高斯模糊
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('in', 'SourceAlpha');
    feGaussianBlur.setAttribute('stdDeviation', '3');
    feGaussianBlur.setAttribute('result', 'blur');

    // 颜色矩阵（创建白色光晕）
    const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    feColorMatrix.setAttribute('in', 'blur');
    feColorMatrix.setAttribute('type', 'matrix');
    feColorMatrix.setAttribute('values', '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0');
    feColorMatrix.setAttribute('result', 'glow');

    // 合并
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'glow');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);

    filter.appendChild(feGaussianBlur);
    filter.appendChild(feColorMatrix);
    filter.appendChild(feMerge);
    defs.appendChild(filter);

    // 创建径向渐变
    const radialGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    radialGradient.setAttribute('id', 'sword-tip-light');
    radialGradient.setAttribute('cx', '50%');
    radialGradient.setAttribute('cy', '50%');
    radialGradient.setAttribute('r', '50%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('style', 'stop-color:rgba(255,255,255,0.9);stop-opacity:1');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '50%');
    stop2.setAttribute('style', 'stop-color:rgba(255,255,255,0.5);stop-opacity:1');

    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('style', 'stop-color:rgba(255,255,255,0);stop-opacity:0');

    radialGradient.appendChild(stop1);
    radialGradient.appendChild(stop2);
    radialGradient.appendChild(stop3);
    defs.appendChild(radialGradient);

    // 创建光晕元素（在剑尖位置，右上角）
    const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    glowCircle.setAttribute('id', 'tip-glow-element');
    glowCircle.setAttribute('cx', '100%');  // 剑尖在右上角
    glowCircle.setAttribute('cy', '0%');
    glowCircle.setAttribute('rx', '20%');  // 光晕宽度
    glowCircle.setAttribute('ry', '30%');  // 光晕高度（椭圆形）
    glowCircle.setAttribute('fill', 'url(#sword-tip-light)');
    glowCircle.setAttribute('filter', 'url(#sword-tip-glow)');
    glowCircle.setAttribute('opacity', '0.8');
    glowCircle.style.transformOrigin = '100% 0%';  // 以剑尖为中心旋转
    
    svgElement.appendChild(glowCircle);
  }

  /**
   * 更新光晕方向（与剑身方向相反）
   */
  private updateGlowDirection(): void {
    if (!this.cursorElement) return;
    
    const glowElement = this.cursorElement.querySelector('#tip-glow-element') as SVGElement;
    if (glowElement) {
      // 光的方向与剑身方向相反，即旋转 180 度
      const glowAngle = this.currentAngle + 180;
      glowElement.style.transform = `rotate(${glowAngle}deg)`;
    }
  }

  /**
   * 移除自定义指针元素
   */
  private removeCursorElement(): void {
    if (this.cursorElement) {
      this.cursorElement.remove();
      this.cursorElement = null;
    }
  }

  /**
   * 添加事件监听器
   */
  private addEventListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseenter', this.handleMouseEnter);
    document.addEventListener('mouseleave', this.handleMouseLeave);
  }

  /**
   * 移除事件监听器
   */
  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseenter', this.handleMouseEnter);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.cursorElement) return;

    const currentPosition: Position = { x: e.clientX, y: e.clientY };

    // 更新位置
    this.cursorElement.style.left = `${currentPosition.x}px`;
    this.cursorElement.style.top = `${currentPosition.y}px`;

    // 计算方向
    if (this.options.showDirection) {
      const now = Date.now();
      if (now - this.lastUpdateTime > this.options.directionSensitivity) {
        this.updateDirection(currentPosition);
        this.lastUpdateTime = now;
      }
    }

    this.lastPosition = currentPosition;
  };

  /**
   * 处理鼠标进入事件
   */
  private handleMouseEnter = (): void => {
    if (this.cursorElement) {
      this.cursorElement.style.display = 'block';
    }
  };

  /**
   * 处理鼠标离开事件
   */
  private handleMouseLeave = (): void => {
    if (this.cursorElement) {
      this.cursorElement.style.display = 'none';
    }
  };

  /**
   * 更新运动方向并计算目标角度
   */
  private updateDirection(currentPosition: Position): void {
    const dx = currentPosition.x - this.lastPosition.x;
    const dy = currentPosition.y - this.lastPosition.y;

    // 如果移动距离太小，认为是静止状态
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      this.currentDirection = 'idle';
      return;
    }

    // 计算鼠标移动的角度（以度为单位）
    // Math.atan2(dy, dx) 返回的是从正右方向（→）开始的角度
    const mouseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // 剑的 SVG 默认方向是从左下到右上（↗），即 -45 度（或 315 度）
    // 要让剑指向鼠标移动方向，需要旋转：mouseAngle - (-45) = mouseAngle + 45
    const newTargetAngle = mouseAngle + 45;

    // 计算角度差（考虑循环）
    let angleDiff = this.normalizeAngleDiff(newTargetAngle - this.targetAngle);

    // 如果角度变化小于阈值，不更新
    if (Math.abs(angleDiff) < this.ANGLE_THRESHOLD) {
      return;
    }

    // 更新目标角度
    this.targetAngle = newTargetAngle;

    // 根据角度确定方向
    this.currentDirection = this.getDirectionFromAngle(mouseAngle);
  }

  /**
   * 标准化角度差到 -180 到 180 之间
   */
  private normalizeAngleDiff(diff: number): number {
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  /**
   * 动画循环：平滑插值到目标角度
   */
  private animateRotation = (): void => {
    if (!this.cursorElement || !this.isActive) return;

    // 计算当前角度和目标角度的差值
    let angleDiff = this.normalizeAngleDiff(this.targetAngle - this.currentAngle);

    // 如果角度差很小，直接设置为目标角度
    if (Math.abs(angleDiff) < 0.1) {
      this.currentAngle = this.targetAngle;
    } else {
      // 检查是否是大角度变化（超过阈值）
      if (Math.abs(angleDiff) > this.LARGE_ANGLE_THRESHOLD) {
        // 大角度变化：使用翻转效果（快速插值）
        this.currentAngle += angleDiff * 0.5; // 加速插值
      } else {
        // 小角度变化：平滑插值
        this.currentAngle += angleDiff * this.ANGLE_LERP_SPEED;
      }
    }

    // 应用旋转（旋转中心在右上角）
    this.cursorElement.style.transform = `translate(-100%, 0%) rotate(${this.currentAngle}deg)`;

    // 更新光晕方向（与剑身方向相反）
    this.updateGlowDirection();

    // 继续动画循环
    this.animationFrameId = requestAnimationFrame(this.animateRotation);
  };

  /**
   * 启动动画循环
   */
  private startAnimationLoop(): void {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(this.animateRotation);
    }
  }

  /**
   * 停止动画循环
   */
  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 根据角度获取方向
   */
  private getDirectionFromAngle(angle: number): Direction {
    // 将角度标准化到 0-360
    const normalizedAngle = ((angle + 360) % 360);

    if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'right';
    if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'down-right';
    if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'down';
    if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'down-left';
    if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'left';
    if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'up-left';
    if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'up';
    if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) return 'up-right';

    return 'idle';
  }

  /**
   * 获取当前方向
   */
  public getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  /**
   * 更新配置
   */
  public updateOptions(options: Partial<CursorOptions>): void {
    this.options = { ...this.options, ...options };

    if (this.cursorElement) {
      if (options.size !== undefined) {
        this.cursorElement.style.width = `${this.options.size}px`;
        this.cursorElement.style.height = `${this.options.size}px`;
      }
      if (options.zIndex !== undefined) {
        this.cursorElement.style.zIndex = `${this.options.zIndex}`;
      }
    }
  }
}

