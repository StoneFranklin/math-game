import React, { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Cell = {
  value: number;
  used: boolean;
  id: string;
};

const GRID_SIZE = 4;

const generateInitialGrid = (): Cell[][] => {
  const grid: Cell[][] = [];
  let id = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      row.push({
        value: Math.floor(Math.random() * 9) + 1, // Random numbers 1-9
        used: false,
        id: `${i}-${j}-${id++}`,
      });
    }
    grid.push(row);
  }
  return grid;
};

export default function MathGame() {
  const [grid, setGrid] = useState<Cell[][]>(generateInitialGrid());
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const getAvailableCells = useCallback(() => {
    return grid.flat().filter((cell) => !cell.used).length;
  }, [grid]);

  const resetGame = () => {
    setGrid(generateInitialGrid());
    setCurrentValue(null);
    setSelectedCell(null);
    setScore(0);
    setMoves(0);
    setGameOver(false);
  };

  // Check for game over whenever grid or selectedCell changes
  useEffect(() => {
    if (selectedCell === null || currentValue === null || gameOver) return;

    const { row, col } = selectedCell;
    const availableCells = grid.flat().filter((c) => !c.used).length;

    // Check for available moves from current position
    let hasAvailableMoves = false;
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          if (!grid[r][c].used && !(r === row && c === col)) {
            hasAvailableMoves = true;
            break;
          }
        }
      }
      if (hasAvailableMoves) break;
    }

    if (availableCells === 0 || !hasAvailableMoves) {
      setGameOver(true);
    }
  }, [grid, selectedCell, currentValue, gameOver, moves]);

  const getDirection = (fromRow: number, fromCol: number, toRow: number, toCol: number): string | null => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // Adjacent cells only (distance of 1)
    if (Math.abs(rowDiff) > 1 || Math.abs(colDiff) > 1) return null;
    if (rowDiff === 0 && colDiff === 0) return null;

    // Determine operation based on direction
    if (rowDiff === 0 && colDiff === 1) return 'add'; // Right
    if (rowDiff === -1 && colDiff === 0) return 'add'; // Up
    if (rowDiff === 0 && colDiff === -1) return 'subtract'; // Left
    if (rowDiff === 1 && colDiff === 0) return 'subtract'; // Down
    if (rowDiff === -1 && colDiff === 1) return 'multiply'; // Up-right
    if (rowDiff === 1 && colDiff === 1) return 'multiply'; // Down-right
    if (rowDiff === -1 && colDiff === -1) return 'divide'; // Up-left
    if (rowDiff === 1 && colDiff === -1) return 'divide'; // Down-left

    return null;
  };

  const getAvailableMoves = useCallback(() => {
    if (selectedCell === null) return [];

    const moves: Array<{ row: number; col: number; operation: string }> = [];
    const { row, col } = selectedCell;

    // Check all adjacent cells (8 directions)
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          if (!grid[r][c].used && !(r === row && c === col)) {
            const operation = getDirection(row, col, r, c);
            if (operation) {
              moves.push({ row: r, col: c, operation });
            }
          }
        }
      }
    }

    return moves;
  }, [selectedCell, grid]);

  const handleCellPress = (row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.used || gameOver) return;

    if (currentValue === null) {
      // First selection
      const newGrid = grid.map(r => r.map(c => ({ ...c })));
      newGrid[row][col].used = true;
      setGrid(newGrid);
      setCurrentValue(cell.value);
      setSelectedCell({ row, col });
      setMoves(moves + 1);
    } else {
      // Second selection - check if it's a valid adjacent cell
      const operation = getDirection(selectedCell!.row, selectedCell!.col, row, col);
      
      if (operation) {
        performOperation(row, col, operation);
      }
      // Invalid moves are just ignored since UI shows available moves
    }
  };

  const performOperation = (targetRow: number, targetCol: number, operation: string) => {
    if (currentValue === null || selectedCell === null) return;

    const targetCell = grid[targetRow][targetCol];
    if (targetCell.used) return;

    let result: number;
    switch (operation) {
      case 'add':
        result = currentValue + targetCell.value;
        break;
      case 'subtract':
        result = currentValue - targetCell.value;
        break;
      case 'multiply':
        result = currentValue * targetCell.value;
        break;
      case 'divide':
        result = targetCell.value !== 0 ? currentValue / targetCell.value : currentValue;
        // Round to 2 decimal places
        result = Math.round(result * 100) / 100;
        break;
      default:
        return;
    }

    // Update grid
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    newGrid[targetRow][targetCol].used = true;
    setGrid(newGrid);
    setCurrentValue(result);
    setSelectedCell({ row: targetRow, col: targetCol });
    setMoves(moves + 1);

    // Update score if this is better
    if (result > score) {
      setScore(result);
    }
  };

  const getOperationSymbol = (operation: string) => {
    switch (operation) {
      case 'add': return '+';
      case 'subtract': return '−';
      case 'multiply': return '×';
      case 'divide': return '÷';
      default: return '';
    }
  };

  const isAvailableMove = (row: number, col: number) => {
    if (selectedCell === null) return false;
    const moves = getAvailableMoves();
    return moves.some(move => move.row === row && move.col === col);
  };

  const getOperationForCell = (row: number, col: number) => {
    if (selectedCell === null) return null;
    const moves = getAvailableMoves();
    const move = moves.find(m => m.row === row && m.col === col);
    return move?.operation || null;
  };

  // Game Over Screen
  if (gameOver) {
    const usedCells = grid.flat().filter((c) => c.used).length;
    const allUsed = usedCells === GRID_SIZE * GRID_SIZE;
    
    return (
      <View style={styles.container}>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>Game Over!</Text>
          
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={styles.scoreValue}>{currentValue}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{moves}</Text>
              <Text style={styles.statLabel}>Moves</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{usedCells}</Text>
              <Text style={styles.statLabel}>Numbers Used</Text>
            </View>
          </View>

          <Text style={styles.gameOverMessage}>
            {allUsed ? '🎉 Amazing! You used all numbers!' : 'No more moves available'}
          </Text>

          <Pressable style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gameContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Math Swipe Game</Text>
          <Text style={styles.info}>
            Score: {currentValue !== null ? currentValue : '--'}
          </Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Tap a number to start, then tap an adjacent number to combine
          </Text>
          <Text style={styles.instructionText}>
            ➡️⬆️ Add | ⬅️⬇️ Subtract | ↗️↘️ Multiply | ↖️↙️ Divide
          </Text>
        </View>

        <View style={styles.grid}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => {
                const isSelected =
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isAvailable = isAvailableMove(rowIndex, colIndex);
                const operation = getOperationForCell(rowIndex, colIndex);

                return (
                  <Pressable
                    key={cell.id}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                    style={[
                      styles.cell,
                      cell.used && styles.cellUsed,
                      isSelected && styles.cellSelected,
                      isAvailable && styles.cellAvailable,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        cell.used && styles.cellTextUsed,
                        isSelected && styles.cellTextSelected,
                      ]}
                    >
                      {cell.value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <Pressable style={styles.resetButton} onPress={resetGame}>
          <Text style={styles.resetButtonText}>New Game</Text>
        </Pressable>

        <View style={styles.howToPlay}>
          <Text style={styles.howToPlayTitle}>How to Play:</Text>
          <Text style={styles.howToPlayText}>
            1. Tap any number to start{'\n'}
            2. Tap an adjacent number to combine{'\n'}
            3. Each number can only be used once{'\n'}
            4. Try to reach the highest number possible!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    color: '#aaa',
    marginVertical: 2,
  },
  instructions: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  grid: {
    aspectRatio: 1,
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#444',
    padding: 5,
    borderRadius: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    margin: 5,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  cellUsed: {
    backgroundColor: '#3a3a3a',
    borderColor: '#444',
    opacity: 0.4,
  },
  cellSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#2a70c2',
    borderWidth: 3,
  },
  cellAvailable: {
    borderColor: '#00aaffff',
    borderWidth: 3.5,
  },
  cellText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e0e0e0',
  },
  cellTextUsed: {
    color: '#777',
  },
  cellTextSelected: {
    color: '#fff',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#4a90e2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  howToPlay: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    borderRadius: 10,
    maxWidth: 400,
  },
  howToPlayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 8,
  },
  howToPlayText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  // Game Over Screen Styles
  gameOverContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 40,
  },
  scoreCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    minWidth: 200,
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  scoreLabel: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e0e0e0',
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  gameOverMessage: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 40,
    textAlign: 'center',
  },
  playAgainButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
