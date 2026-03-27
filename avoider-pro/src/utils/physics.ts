import { Entity } from '../types';

/**
 * Axis-Aligned Bounding Box (AABB) Collision Detection
 */
export const checkCollision = (rect1: Entity, rect2: Entity): boolean => {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.y + rect1.h > rect2.y
  );
};

/**
 * Clamp a value between min and max
 */
export const clamp = (val: number, min: number, max: number): number => {
  return Math.min(Math.max(val, min), max);
};

/**
 * Linear interpolation
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};