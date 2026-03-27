import { CellData } from '../types';

export const getNeighbors = (index: number, rows: number, cols: number): number[] => {
  const neighbors: number[] = [];
  const x = index % cols;
  const y = Math.floor(index / cols);

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        neighbors.push(ny * cols + nx);
      }
    }
  }
  return neighbors;
};

export const generateBoard = (rows: number, cols: number, mines: number, safeIndex: number): CellData[] => {
  const count = rows * cols;
  const board: CellData[] = new Array(count).fill(null).map((_, i) => ({
    id: i,
    isMine: false,
    revealed: false,
    flagged: false,
    exploded: false,
    neighborMines: 0
  }));

  // Create safe zone around first click
  const safeZone = new Set([safeIndex, ...getNeighbors(safeIndex, rows, cols)]);
  
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const idx = Math.floor(Math.random() * count);
    if (!board[idx].isMine && !safeZone.has(idx)) {
      board[idx].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate numbers
  for (let i = 0; i < count; i++) {
    if (!board[i].isMine) {
      const neighbors = getNeighbors(i, rows, cols);
      board[i].neighborMines = neighbors.reduce((acc, nIdx) => acc + (board[nIdx].isMine ? 1 : 0), 0);
    }
  }

  return board;
};

export const floodFill = (board: CellData[], index: number, rows: number, cols: number): CellData[] => {
  const newBoard = [...board];
  const stack = [index];

  while (stack.length > 0) {
    const currentIdx = stack.pop();
    if (currentIdx === undefined) continue;
    
    const cell = newBoard[currentIdx];

    if (cell.revealed || cell.flagged) continue;

    newBoard[currentIdx] = { ...cell, revealed: true };

    if (cell.neighborMines === 0) {
      const neighbors = getNeighbors(currentIdx, rows, cols);
      neighbors.forEach(nIdx => {
        if (!newBoard[nIdx].revealed && !newBoard[nIdx].flagged) {
          stack.push(nIdx);
        }
      });
    }
  }
  return newBoard;
};