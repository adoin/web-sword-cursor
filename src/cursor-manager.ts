import { CursorOptions, Direction, Position, FloatingObjectType } from './types';
import defaultSwordSvg from './assets/svgs/sword-1.svg';

/**
 * 鼠标指针管理器
 */
export class CursorManager {
  private options: Required<Omit<CursorOptions, 'swordItem' | 'floatingObjects'>> & { 
    swordItem: string | SVGElement | undefined;
    floatingObjects: FloatingObjectType[];
  };
  private cursorElement: HTMLElement | null = null;
  private lastPosition: Position = { x: 0, y: 0 };
  private currentDirection: Direction = 'idle';
  private lastUpdateTime: number = 0;
  private isActive: boolean = false;
  private currentAngle: number = -45; // 默认角度：从左下到右上（↗）在标准坐标系中是 -45度
  private targetAngle: number = -45; // 目标角度
  private readonly ANGLE_THRESHOLD: number = 18; // 角度变化阈值（度）
  private readonly LARGE_ANGLE_THRESHOLD: number = 90; // 大角度变化阈值（度）
  private animationFrameId: number | null = null; // 动画帧ID
  private readonly ANGLE_LERP_SPEED: number = 0.2; // 角度插值速度（0-1）
  private lastMoveTime: number = 0; // 上次移动时间
  private currentSpeed: number = 0; // 当前速度（像素/秒）
  private velocityAngle: number = -45; // 速度方向角度（鼠标移动的方向）
  private readonly MIN_GLOW_SCALE: number = 0.8; // 最小光晕缩放（移动时）
  private readonly MAX_GLOW_SCALE: number = 2.5; // 最大光晕缩放
  private readonly SPEED_THRESHOLD: number = 1000; // 速度阈值（像素/秒，超过此值光晕达到最大）
  private readonly MIN_SPEED_FOR_GLOW: number = 50; // 显示光晕的最小速度（px/s）
  
  // 漂浮物相关
  private orbitAngles: number[] = []; // 漂浮物的当前角度
  private readonly ORBIT_RADII: number[] = [10, 18, 26]; // 三个不同的轨道半径
  private readonly BALL_POSITIONS: number[] = [0.2, 0.5, 0.8]; // 漂浮物在轴线上的位置（靠前到靠后）
  private readonly BALL_SIZES: number[] = [4, 6, 8]; // 漂浮物的基础大小
  private readonly SHAPE_CONFIG: Record<FloatingObjectType, { color: string; fontSize?: number }> = {
    'circle': { color: 'rgba(173, 216, 230, 0.9)' }, // 淡蓝色圆形
    'star': { color: 'rgba(255, 50, 50, 1)' }, // 红色五角星（加深颜色，增加不透明度）
    'lightning': { color: '', fontSize: 0.6 } // 闪电 emoji
  };
  private readonly BASE_ANGULAR_SPEED: number = 2; // 基础角速度（度/帧）

  constructor(options: CursorOptions = {}) {
    this.options = {
      size: options.size ?? 32,
      showDirection: options.showDirection ?? true,
      directionSensitivity: options.directionSensitivity ?? 50,
      zIndex: options.zIndex ?? 9999,
      swordItem: options.swordItem,
      floatingObjects: (options.floatingObjects ?? []).slice(0, 3) // 最多3个
    };
    
    // 初始化漂浮物角度（平均分布）
    const count = this.options.floatingObjects.length;
    if (count > 0) {
      const angleStep = 360 / count;
      this.orbitAngles = Array.from({ length: count }, (_, i) => i * angleStep);
    }
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
    this.setSvgContent();

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
   * 设置 SVG 内容
   */
  private setSvgContent(): void {
    if (!this.cursorElement) return;

    const { swordItem } = this.options;

    if (!swordItem) {
      // 使用内置默认图标
      this.cursorElement.innerHTML = defaultSwordSvg;
    } else if (typeof swordItem === 'string') {
      // 传入的是 SVG 字符串
      this.cursorElement.innerHTML = swordItem;
    } else if (swordItem instanceof SVGElement) {
      // 传入的是 SVG DOM 元素
      const clonedSvg = swordItem.cloneNode(true) as SVGElement;
      this.cursorElement.appendChild(clonedSvg);
    } else {
      // 类型不对，使用默认
      console.warn('Invalid swordItem type, using default sword');
      this.cursorElement.innerHTML = defaultSwordSvg;
    }
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
    
    // 添加旋转小球（在 SVG 外部，使用 HTML div）
    this.addOrbitBalls();
  }

  /**
   * 添加围绕鼠标飞行方向旋转的漂浮物
   */
  private addOrbitBalls(): void {
    if (!this.cursorElement) return;
    
    const floatingObjects = this.options.floatingObjects;
    
    // 根据配置创建漂浮物
    floatingObjects.forEach((shape, i) => {
      const element = document.createElement('div');
      element.id = `orbit-ball-${i}`;
      
      const config = this.SHAPE_CONFIG[shape];
      const color = config.color;
      const size = this.BALL_SIZES[i] * 2;
      
      // 基础样式
      let shapeStyle = '';
      
      if (shape === 'circle') {
        // 圆形
        shapeStyle = `
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, ${color}, ${color.replace('0.9', '0.7')});
        `;
      } else if (shape === 'star') {
        // 五角星 ⭐
        shapeStyle = `
          clip-path: polygon(
            50% 0%, 
            61% 35%, 
            98% 35%, 
            68% 57%, 
            79% 91%, 
            50% 70%, 
            21% 91%, 
            32% 57%, 
            2% 35%, 
            39% 35%
          );
          background: linear-gradient(135deg, ${color}, ${color.replace('0.9', '0.6')});
        `;
      } else if (shape === 'lightning') {
        // 闪电 emoji ⚡
        element.textContent = '⚡';
        const fontSize = config.fontSize ?? 0.6;
        shapeStyle = `
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * fontSize}px;
          line-height: 1;
          background: transparent;
        `;
      }
      
      // box-shadow（闪电 emoji 不需要，五角星加强）
      let shadowStyle = '';
      if (shape === 'circle') {
        shadowStyle = `box-shadow: 0 0 ${size * 1.5}px ${color.replace('0.9', '0.5')};`;
      } else if (shape === 'star') {
        // 五角星使用更强的阴影
        shadowStyle = `box-shadow: 0 0 ${size * 2}px ${color.replace('1', '0.8')}, 0 0 ${size * 3}px ${color.replace('1', '0.4')};`;
      }
      
      element.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        ${shapeStyle}
        ${shadowStyle}
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      `;
      
      this.cursorElement!.appendChild(element);
    });
  }

  /**
   * 更新光晕方向和大小（与剑身方向相反，大小根据速度变化）
   */
  private updateGlowDirection(): void {
    if (!this.cursorElement) return;
    
    const glowElement = this.cursorElement.querySelector('#tip-glow-element') as SVGElement;
    if (glowElement) {
      // 如果速度低于阈值，隐藏光晕
      if (this.currentSpeed < this.MIN_SPEED_FOR_GLOW) {
        glowElement.style.opacity = '0';
        return;
      }
      
      // 光的方向与剑身方向相反，即旋转 180 度
      const glowAngle = this.currentAngle + 180;
      
      // 根据速度计算光晕缩放比例
      const speedRatio = Math.min(this.currentSpeed / this.SPEED_THRESHOLD, 1);
      const glowScale = this.MIN_GLOW_SCALE + (this.MAX_GLOW_SCALE - this.MIN_GLOW_SCALE) * speedRatio;
      
      // 根据速度调整透明度（速度快时更亮）
      const glowOpacity = 0.6 + 0.4 * speedRatio;
      
      glowElement.style.transform = `rotate(${glowAngle}deg) scale(${glowScale})`;
      glowElement.style.opacity = glowOpacity.toString();
    }
  }

  /**
   * 更新围绕飞行方向旋转的漂浮物
   * 漂浮物绕飞行轨迹线 L 旋转，保持固定半径 d
   */
  private updateOrbitBalls(): void {
    if (!this.cursorElement) return;
    
    const floatingObjects = this.options.floatingObjects;
    const count = floatingObjects.length;
    
    // 如果没有漂浮物，直接返回
    if (count === 0) return;
    
    // 如果速度低于阈值，隐藏漂浮物
    if (this.currentSpeed < this.MIN_SPEED_FOR_GLOW) {
      for (let i = 0; i < count; i++) {
        const ball = this.cursorElement.querySelector(`#orbit-ball-${i}`) as HTMLElement;
        if (ball) {
          ball.style.opacity = '0';
        }
      }
      return;
    }
    
    // 根据速度计算角速度（速度越快，旋转越快）
    const speedRatio = Math.min(this.currentSpeed / this.SPEED_THRESHOLD, 1);
    const angularSpeed = this.BASE_ANGULAR_SPEED * (1 + speedRatio * 4); // 1x ~ 5x 速度
    
    // 容器大小
    const containerSize = this.options.size;
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;
    
    // 飞行方向的角度（使用速度方向，不是剑的朝向）
    // 往右转 45 度
    const adjustedAngle = this.velocityAngle + 45;
    const flightAngleRad = (adjustedAngle * Math.PI) / 180;
    
    // 飞行方向的单位向量（L 的方向，即鼠标移动的方向 + 45度）
    const dirX = Math.cos(flightAngleRad);
    const dirY = Math.sin(flightAngleRad);
    
    // 垂直于 L 的方向向量（在 2D 平面上，逆时针旋转 90°）
    const perpX = -dirY;
    const perpY = dirX;
    
    // 更新每个漂浮物
    for (let i = 0; i < count; i++) {
      // 更新旋转角度
      this.orbitAngles[i] = (this.orbitAngles[i] + angularSpeed) % 360;
      const theta = (this.orbitAngles[i] * Math.PI) / 180;
      
      // 小球在 L 轴线上的位置（圆心 O）
      const positionAlongAxis = this.BALL_POSITIONS[i]; // 0.3, 0.5, 0.7
      const axisLength = containerSize * 0.7;
      const distAlongAxis = (positionAlongAxis - 0.5) * axisLength;
      
      // O 点坐标（球的旋转中心）
      const oX = centerX + dirX * distAlongAxis;
      const oY = centerY + dirY * distAlongAxis;
      
      // 半径 d（每个球不同）
      const radius = this.ORBIT_RADII[i];
      
      // 球绕 O 点旋转，球到 O 的距离始终是 d
      // 在 3D 空间中：
      // - L 是 Z 轴（飞行方向）
      // - perpX/perpY 是 X 轴（垂直于 L 在屏幕上）
      // - 第三个轴是 Y 轴（垂直于屏幕，朝外）
      
      // 用 theta 角度在垂直于 L 的圆上旋转
      // X 分量（屏幕上可见的垂直偏移）
      const x_offset = radius * Math.cos(theta) * perpX;
      const y_offset = radius * Math.cos(theta) * perpY;
      
      // Z 分量（深度，垂直于屏幕）
      const z_depth = radius * Math.sin(theta);
      
      // 球的 2D 投影位置
      const ballCenterX = oX + x_offset;
      const ballCenterY = oY + y_offset;
      
      // 景深效果
      // z_depth > 0: 球在屏幕前方（靠近观察者）
      // z_depth < 0: 球在屏幕后方（远离观察者）
      const maxDepth = radius; // 最大深度
      const depthRatio = (z_depth + maxDepth) / (2 * maxDepth); // 0 ~ 1 (0=最远, 1=最近)
      
      // 透视缩放：近大远小
      const perspectiveScale = 0.7 + 0.6 * depthRatio; // 0.7x ~ 1.3x
      
      // 透明度：近亮远暗
      const depthOpacity = 0.4 + 0.6 * depthRatio; // 0.4 ~ 1.0
      
      // div 左上角位置
      const ballSize = this.BALL_SIZES[i] * 2;
      const ballX = ballCenterX - (ballSize * perspectiveScale) / 2;
      const ballY = ballCenterY - (ballSize * perspectiveScale) / 2;
      
      // 更新位置和样式
      const ball = this.cursorElement.querySelector(`#orbit-ball-${i}`) as HTMLElement;
      if (ball) {
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
        
        // 综合透明度：速度 + 景深 + 层次
        const baseOpacity = 0.5 + 0.4 * speedRatio;
        const opacity = baseOpacity * depthOpacity - i * 0.05;
        ball.style.opacity = Math.max(0.2, Math.min(1, opacity)).toString();
        
        // 透视缩放
        ball.style.transform = `scale(${perspectiveScale})`;
        
        // Z-index：近的在上，远的在下
        const zIndex = Math.round(1000 + depthRatio * 100);
        ball.style.zIndex = zIndex.toString();
        
        // 模糊效果：只有后方（远处）的元素模糊，前方清晰
        // depthRatio > 0.6 时（前方 60%）不模糊
        const blurAmount = depthRatio > 0.6 ? 0 : (0.6 - depthRatio) * 3; // 前方0px，后方最多1.8px
        ball.style.filter = blurAmount > 0.1 ? `blur(${blurAmount}px)` : 'none';
      }
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
    const now = Date.now();

    // 计算速度和方向（像素/秒）
    if (this.lastMoveTime > 0) {
      const timeDelta = (now - this.lastMoveTime) / 1000; // 转换为秒
      if (timeDelta > 0) {
        const dx = currentPosition.x - this.lastPosition.x;
        const dy = currentPosition.y - this.lastPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const instantSpeed = distance / timeDelta;
        
        // 使用指数移动平均平滑速度变化
        this.currentSpeed = this.currentSpeed * 0.7 + instantSpeed * 0.3;
        
        // 计算速度方向（移动方向）
        if (distance > 1) { // 移动距离足够大才更新方向
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          this.velocityAngle = angle;
        }
      }
    }
    this.lastMoveTime = now;

    // 更新位置
    this.cursorElement.style.left = `${currentPosition.x}px`;
    this.cursorElement.style.top = `${currentPosition.y}px`;

    // 计算方向
    if (this.options.showDirection) {
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

    // 速度衰减（模拟摩擦力，静止时速度逐渐降为0）
    const now = Date.now();
    const timeSinceLastMove = (now - this.lastMoveTime) / 1000;
    if (timeSinceLastMove > 0.1) { // 如果超过 100ms 没有移动
      this.currentSpeed *= 0.85; // 速度衰减
      if (this.currentSpeed < 1) {
        this.currentSpeed = 0; // 速度太小时直接归零
      }
    }

    // 更新光晕方向（与剑身方向相反）
    this.updateGlowDirection();

    // 更新围绕飞行方向旋转的小球
    this.updateOrbitBalls();

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
   * 获取当前速度（像素/秒）
   */
  public getCurrentSpeed(): number {
    return Math.round(this.currentSpeed);
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

