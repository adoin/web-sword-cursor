/**
 * 漂浮物类型
 */
export type FloatingObjectType = 'circle' | 'lightning' | 'star';

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

