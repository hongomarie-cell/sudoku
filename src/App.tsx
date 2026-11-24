import { useState, useEffect, useCallback } from 'react';
import './App.css';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Cell {
  row: number;
  col: number;
  value: number;
  solution: number;
  isFixed: boolean;
  notes: number[];
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; removeCount: number }> = {
  easy: { label: 'かんたん', removeCount: 34 },
  medium: { label: 'ふつう', removeCount: 44 },
  hard: { label: 'むずかしい', removeCount: 52 },
};

function generateSudoku(difficulty: Difficulty): Cell[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  const isValid = (r: number, c: number, num: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === num || board[i][c] === num) return false;
    }
    const startR = Math.floor(r / 3) * 3;
    const startC = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[startR + i][startC + j] === num) return false;
      }
    }
    return true;
  };

  const fillBoard = (r = 0, c = 0): boolean => {
    if (r === 9) return true;
    const nextR = c === 8 ? r + 1 : r;
    const nextC = c === 8 ? 0 : c + 1;

    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    for (const num of nums) {
      if (isValid(r, c, num)) {
        board[r][c] = num;
        if (fillBoard(nextR, nextC)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  };

  fillBoard();
  const solution = board.map((row) => [...row]);

  const puzzle = board.map((row) => [...row]);
  let removed = 0;
  const targetRemove = DIFFICULTY_CONFIG[difficulty].removeCount;
  const positions = Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]).sort(
    () => Math.random() - 0.5
  );

  for (const [r, c] of positions) {
    if (removed >= targetRemove) break;
    puzzle[r][c] = 0;
    removed++;
  }

  return puzzle.map((row, r) =>
    row.map((val, c) => ({
      row: r,
      col: c,
      value: val,
      solution: solution[r][c],
      isFixed: val !== 0,
      notes: [],
    }))
  );
}

const cloneBoard = (board: Cell[][]): Cell[][] =>
  board.map((row) => row.map((cell) => ({ ...cell, notes: [...cell.notes] })));

const UndoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
  </svg>
);

const EraserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);

const PencilIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const LightbulbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const RotateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Cell[][]>(() => generateSudoku('easy'));
  const [history, setHistory] = useState<Cell[][][]>([]);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [noteMode, setNoteMode] = useState<boolean>(false);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [isCleared, setIsCleared] = useState<boolean>(false);

  const startNewGame = useCallback(
    (diff: Difficulty = difficulty) => {
      setDifficulty(diff);
      setBoard(generateSudoku(diff));
      setHistory([]);
      setSelected(null);
      setNoteMode(false);
      setHintsLeft(3);
      setIsCleared(false);
    },
    [difficulty]
  );

  useEffect(() => {
    if (board.length === 0) return;
    const completed = board.every((row) =>
      row.every((cell) => cell.value !== 0 && cell.value === cell.solution)
    );
    if (completed) {
      setIsCleared(true);
    }
  }, [board]);

  const handleNumberInput = useCallback(
    (num: number) => {
      if (!selected || isCleared) return;
      const { row, col } = selected;
      const target = board[row][col];
      if (target.isFixed) return;

      setHistory((prev) => [...prev, cloneBoard(board)]);

      setBoard((prevBoard) => {
        const next = cloneBoard(prevBoard);
        const cell = next[row][col];

        if (noteMode) {
          cell.value = 0;
          if (cell.notes.includes(num)) {
            cell.notes = cell.notes.filter((n) => n !== num);
          } else {
            cell.notes = [...cell.notes, num].sort((a, b) => a - b);
          }
        } else {
          if (cell.value === num) {
            cell.value = 0;
          } else {
            cell.value = num;
            cell.notes = [];
            if (num === cell.solution) {
              const boxR = Math.floor(row / 3) * 3;
              const boxC = Math.floor(col / 3) * 3;
              for (let i = 0; i < 9; i++) {
                next[row][i].notes = next[row][i].notes.filter((n) => n !== num);
                next[i][col].notes = next[i][col].notes.filter((n) => n !== num);
              }
              for (let r = boxR; r < boxR + 3; r++) {
                for (let c = boxC; c < boxC + 3; c++) {
                  next[r][c].notes = next[r][c].notes.filter((n) => n !== num);
                }
              }
            }
          }
        }
        return next;
      });
    },
    [selected, isCleared, board, noteMode]
  );

  const handleUndo = () => {
    if (history.length === 0 || isCleared) return;
    const previous = history[history.length - 1];
    setBoard(previous);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleErase = () => {
    if (!selected || isCleared) return;
    const { row, col } = selected;
    const target = board[row][col];
    if (target.isFixed || (target.value === 0 && target.notes.length === 0)) return;

    setHistory((prev) => [...prev, cloneBoard(board)]);
    setBoard((prev) => {
      const next = cloneBoard(prev);
      next[row][col].value = 0;
      next[row][col].notes = [];
      return next;
    });
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || isCleared) return;

    let targetR = -1;
    let targetC = -1;

    if (
      selected &&
      !board[selected.row][selected.col].isFixed &&
      board[selected.row][selected.col].value !== board[selected.row][selected.col].solution
    ) {
      targetR = selected.row;
      targetC = selected.col;
    } else {
      const candidates: [number, number][] = [];
      board.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell.value !== cell.solution) candidates.push([r, c]);
        })
      );
      if (candidates.length === 0) return;
      [targetR, targetC] = candidates[Math.floor(Math.random() * candidates.length)];
    }

    setHistory((prev) => [...prev, cloneBoard(board)]);
    setBoard((prev) => {
      const next = cloneBoard(prev);
      const ans = next[targetR][targetC].solution;
      next[targetR][targetC].value = ans;
      next[targetR][targetC].notes = [];
      return next;
    });
    setSelected({ row: targetR, col: targetC });
    setHintsLeft((h) => h - 1);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
      } else if (e.key.toLowerCase() === 'n') {
        setNoteMode((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelected((prev) => {
          if (!prev) return { row: 0, col: 0 };
          let { row, col } = prev;
          if (e.key === 'ArrowUp') row = (row + 8) % 9;
          if (e.key === 'ArrowDown') row = (row + 1) % 9;
          if (e.key === 'ArrowLeft') col = (col + 8) % 9;
          if (e.key === 'ArrowRight') col = (col + 1) % 9;
          return { row, col };
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNumberInput, selected]);

  const remainingCounts = Array.from({ length: 9 }, (_, i) => {
    const num = i + 1;
    let placedCorrectly = 0;
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell.value === num && cell.value === cell.solution) placedCorrectly++;
      })
    );
    return 9 - placedCorrectly;
  });

  const selectedCell = selected ? board[selected.row][selected.col] : null;

  return (
    <div className="tartan-bg">
      <main className="game-card">
        <header className="game-header">
          <div className="title-area">
          <h1 className="game-title">SUDOKU💎9×9</h1>
            
          </div>

          <div className="difficulty-tabs">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => (
              <button
                key={diff}
                type="button"
                className={`diff-btn ${difficulty === diff ? 'active' : ''}`}
                onClick={() => startNewGame(diff)}
              >
                {DIFFICULTY_CONFIG[diff].label}
              </button>
            ))}
          </div>
        </header>

        <div className="board-wrapper">
          <div className="sudoku-grid" role="grid" aria-label="数独ボード">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isSelected = selected?.row === r && selected?.col === c;
                const isRelated =
                  selected &&
                  !isSelected &&
                  (selected.row === r ||
                    selected.col === c ||
                    (Math.floor(selected.row / 3) === Math.floor(r / 3) &&
                      Math.floor(selected.col / 3) === Math.floor(c / 3)));
                const isSameNumber =
                  selectedCell &&
                  selectedCell.value !== 0 &&
                  cell.value === selectedCell.value &&
                  !isSelected;
                const isError = cell.value !== 0 && cell.value !== cell.solution;

                const cellClasses = [
                  'sudoku-cell',
                  cell.isFixed ? 'fixed' : 'user-input',
                  isSelected ? 'selected' : '',
                  isRelated ? 'related' : '',
                  isSameNumber ? 'same-number' : '',
                  isError ? 'error' : '',
                  c === 2 || c === 5 ? 'border-right-thick' : '',
                  r === 2 || r === 5 ? 'border-bottom-thick' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={cellClasses}
                    onClick={() => setSelected({ row: r, col: c })}
                  >
                    {cell.value !== 0 ? (
                      <span className="cell-value">{cell.value}</span>
                    ) : cell.notes.length > 0 ? (
                      <div className="notes-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <span key={n} className="note-num">
                            {cell.notes.includes(n) ? n : ''}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {isCleared && (
            <div className="clear-overlay">
              <div className="clear-modal">
                <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>🎉</div>
                <h2>CONGRATULATIONS!</h2>
                <p>「{DIFFICULTY_CONFIG[difficulty].label}」をクリアしました！</p>
                <button
                  type="button"
                  className="primary-new-btn"
                  onClick={() => startNewGame(difficulty)}
                >
                  ✨ もう一度遊ぶ
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="action-bar">
          <button
            type="button"
            className="action-btn"
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            <div className="action-icon-wrap">
              <UndoIcon />
            </div>
            <span>戻る</span>
          </button>

          <button type="button" className="action-btn" onClick={handleErase}>
            <div className="action-icon-wrap">
              <EraserIcon />
            </div>
            <span>消しゴム</span>
          </button>

          <button
            type="button"
            className={`action-btn note-toggle ${noteMode ? 'on' : 'off'}`}
            onClick={() => setNoteMode((prev) => !prev)}
          >
            <div className="action-icon-wrap">
              <PencilIcon />
              <span className={`badge ${noteMode ? 'badge-on' : 'badge-off'}`}>
                {noteMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <span>仮置き</span>
          </button>

          <button
            type="button"
            className="action-btn"
            onClick={handleHint}
            disabled={hintsLeft <= 0}
          >
            <div className="action-icon-wrap">
              <LightbulbIcon />
              <span className="badge badge-hint">{hintsLeft}</span>
            </div>
            <span>ヒント</span>
          </button>

          <button
            type="button"
            className="action-btn new-game-btn"
            onClick={() => startNewGame(difficulty)}
          >
            <div className="action-icon-wrap">
              <RotateIcon />
            </div>
            <span>新規ゲーム</span>
          </button>
        </div>

        <div className="numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, idx) => {
            const left = remainingCounts[idx];
            return (
              <button
                key={num}
                type="button"
                className={`num-btn ${noteMode ? 'note-active' : ''} ${left === 0 ? 'completed' : ''}`}
                onClick={() => handleNumberInput(num)}
              >
                <span className="num-main">{num}</span>
                <span className="num-rem">{left > 0 ? left : '✓'}</span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;