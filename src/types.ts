/**
 * 漂浮物类型
 */
export type FloatingObjectType = 'circle' | 'lightning' | 'star';

/**
 * 波纹类型
 */
export type RippleType = 'dot' | 'boat';

/**
 * 波纹效果配置选项
 */
export interface RippleOptions {
  /** 是否启用波纹效果 */
  enabled?: boolean;
  /** 波纹类型：'dot' 圆形扩散，'boat' 划船效果（沿剑尖两侧拨开） */
  type?: RippleType;
  /** 波纹最大半径（像素） */
  maxRadius?: number;
  /** 波纹持续时间（毫秒） */
  duration?: number;
  /** 波纹生成间隔（毫秒） */
  interval?: number;
  /** 最大同时存在的波纹数量 */
  maxCount?: number;
}

/**
 * 鼠标指针配置选项
 */
export interface CursorOptions {
  /** 指针大小（像素） */
  size?: number;
  /** 是否显示运动方向指示 */
  showDirection?: boolean;
  /** 方向更新的灵敏度（毫秒） */
  directionSensitivity?: number;
  /** 自定义 z-index */
  zIndex?: number;
  /** 自定义剑 SVG（可以是 SVG 字符串或 SVGElement），不传则使用内置默认图标 */
  swordItem?: string | SVGElement;
  /** 漂浮物配置（最多3个，最少0个），第一个最靠前，后面依次靠后。默认为空数组 */
  floatingObjects?: FloatingObjectType[];
  /** 波纹效果配置 */
  ripple?: RippleOptions;
}

/**
 * 方向类型
 */
export type Direction = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' | 'idle';

/**
 * 位置坐标
 */
export interface Position {
  x: number;
  y: number;
}

