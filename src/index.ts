/**
 * Web Sword Cursor - 一个用于替换网页鼠标指针的 JavaScript 库
 * @author Your Name
 * @license MIT
 */

import { CursorManager } from './cursor-manager';
import { CursorOptions, Direction, Position, SwordType } from './types';

// 导出类型
export type { CursorOptions, Direction, Position, SwordType };

// 导出主类
export { CursorManager };

// 默认导出
export default CursorManager;

/**
 * 快速初始化函数
 * @param options 配置选项
 * @returns CursorManager 实例
 */
export function initSwordCursor(options?: CursorOptions): CursorManager {
  const manager = new CursorManager(options);
  manager.init();
  return manager;
}

