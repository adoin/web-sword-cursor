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

