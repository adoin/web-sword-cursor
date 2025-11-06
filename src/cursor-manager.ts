import { CursorOptions, Direction, Position } from './types';
import sword1Svg from './assets/svgs/sword-1.svg';

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
  private readonly ANGLE_THRESHOLD: number = 3; // 角度变化阈值（度）

  // SVG 数据（内嵌到代码中）
  private svgData: Map<string, string> = new Map([
    ['sword-1', sword1Svg]
  ]);

  constructor(options: CursorOptions = {}) {
    this.options = {
      size: options.size ?? 32,
      showDirection: options.showDirection ?? true,
      directionSensitivity: options.directionSensitivity ?? 50,
      zIndex: options.zIndex ?? 9999
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

    this.isActive = true;
  }

  /**
   * 销毁并恢复默认鼠标指针
   */
  public destroy(): void {
    if (!this.isActive) return;

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
      transition: transform 0.05s ease-out;
    `;

    // 设置 SVG 内容
    const svgContent = this.svgData.get('sword-1') || '';
    this.cursorElement.innerHTML = svgContent;

    // 确保 SVG 填充整个容器
    const svgElement = this.cursorElement.querySelector('svg');
    if (svgElement) {
      svgElement.style.width = '100%';
      svgElement.style.height = '100%';
    }

    document.body.appendChild(this.cursorElement);
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
   * 更新运动方向并旋转指针
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
    const targetAngle = mouseAngle + 45;

    // 计算角度差（考虑循环）
    let angleDiff = targetAngle - this.currentAngle;
    
    // 将角度差标准化到 -180 到 180 之间
    while (angleDiff > 180) angleDiff -= 360;
    while (angleDiff < -180) angleDiff += 360;

    // 如果角度变化小于阈值，不更新
    if (Math.abs(angleDiff) < this.ANGLE_THRESHOLD) {
      return;
    }

    // 更新当前角度
    this.currentAngle = targetAngle;

    // 根据角度确定方向
    this.currentDirection = this.getDirectionFromAngle(mouseAngle);

    // 旋转指针（旋转中心在右上角）
    if (this.cursorElement) {
      this.cursorElement.style.transform = `translate(-100%, 0%) rotate(${this.currentAngle}deg)`;
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

