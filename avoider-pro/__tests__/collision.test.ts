import { describe, it, expect } from '@jest/globals';
import { checkCollision } from '../src/lib/collision';
import { Entity } from '../src/types';

const createEntity = (x: number, y: number, w: number, h: number): Entity => ({
  id: 'test', type: 'obstacle', vx: 0, vy: 0, color: 'red',
  x, y, w, h
});

describe('Collision Detection', () => {
  it('detects overlap correctly', () => {
    const p = createEntity(10, 10, 50, 50);
    const o = createEntity(30, 30, 50, 50); // Overlapping
    expect(checkCollision(p, o)).toBe(true);
  });

  it('detects no overlap', () => {
    const p = createEntity(10, 10, 50, 50);
    const o = createEntity(100, 100, 50, 50); // Far away
    expect(checkCollision(p, o)).toBe(false);
  });

  it('detects touching edges (usually false in AABB exclusive)', () => {
    const p = createEntity(0, 0, 50, 50);
    const o = createEntity(50, 0, 50, 50); // Touching right edge
    expect(checkCollision(p, o)).toBe(false);
  });
});