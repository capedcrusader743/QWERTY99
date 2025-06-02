import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameState {
  gameId: string;
  sentence: string;
  difficulty: number;
  errors: number;
  backspaces: number;
  maxErrors: number;
  maxBackspaces: number;
  wpm: number;
  startTime: number | null;
}

export default function TypeGame() {
  const [game, setGame] = useState<GameState | null>(null);
  const [input, setInput] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const previousInputLength = useRef(0);
  const navigate = useNavigate();

  // Initialize game
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true);
        const startRes = await fetch('http://localhost:8000/start', {
          method: 'POST'
        });
        const { game_id } = await startRes.json();

        const sentenceRes = await fetch(`http://localhost:8000/sentence/${game_id}`);
        const { sentence, level } = await sentenceRes.json();

        setGame({
          gameId: game_id,
          sentence,
          difficulty: level,
          errors: 0,
          backspaces: 0,
          maxErrors: 5,
          maxBackspaces: 5,
          wpm: 0,
          startTime: Date.now()
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to initialize game');
        setLoading(false);
      }
    };
    initializeGame();
  }, []);

  // Handle input changes
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!game) return;
    const newValue = e.target.value;
    const isBackspace = newValue.length < input.length;

    // Track backspaces locally
    let newBackspaces = game.backspaces;
    if (isBackspace && newBackspaces < game.maxBackspaces) {
      newBackspaces = game.backspaces + 1;
    }

    setInput(newValue);

    try {
      const response = await fetch('http://localhost:8000/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: game.gameId,
          typed: newValue,
          backspace: isBackspace
        })
      });

      const result = await response.json();

      // Update game state from backend response
      setGame(prev => ({
        ...prev!,
        errors: result.errors,
        backspaces: newBackspaces,
      }));

      if (result.game_over) {
        setGameOver(true);
        return;
      }

      // If sentence completed, get next one
      if (result.completed) {
        const calculateWpm = () => {
          if (!game.startTime) return 0;
          const words = game.sentence.split(' ').length;
          const minutes = (Date.now() - game.startTime) / 60000;
          return Math.round(words / minutes);
        };

        const wpm = calculateWpm();
        const sentenceRes = await fetch(`http://localhost:8000/sentence/${game.gameId}`);
        const { sentence, level } = await sentenceRes.json();

        setGame(prev => ({
          ...prev!,
          sentence,
          difficulty: level,
          wpm,
          startTime: Date.now(),
          // Keep the same backspace count between sentences
          backspaces: newBackspaces
        }));
        setInput('');
      }
    } catch (err) {
      console.error('Error submitting input:', err);
    }

    previousInputLength.current = newValue.length;
  };

  // Render colored sentence
  const renderSentence = () => {
    if (!game) return null;

    return game.sentence.split('').map((char, i) => {
      let className = 'text-gray-400'; // Not typed yet

      if (i < input.length) {
        className = input[i] === char
          ? 'text-green-500' // Correct
          : game.backspaces >= game.maxBackspaces
            ? 'text-red-500 underline' // Error (no backspaces left)
            : 'text-yellow-500'; // Warning (can still backspace)
      }

      return (
        <span key={i} className={`${className} text-2xl font-mono`}>
          {char}
        </span>
      );
    });
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (loading) return <div className="text-white text-center">Loading game...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!game) return <div className="text-white text-center">Game not initialized</div>;

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <h1 className="text-4xl text-red-500 mb-4">Game Over!</h1>
        <div className="text-white mb-6">
          <p>Final WPM: {game.wpm}</p>
          <p>Difficulty Reached: Level {game.difficulty}</p>
          <p>Errors: {game.errors}/{game.maxErrors}</p>
          <p>Backspaces Used: {game.backspaces}/{game.maxBackspaces}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Game stats */}
        <div className="flex justify-between text-white mb-8">
          <div>Level: {game.difficulty}</div>
          <div className={game.errors >= game.maxErrors - 2 ? 'text-red-400' : 'text-yellow-400'}>
            Errors: {game.errors}/{game.maxErrors}
          </div>
          <div className={game.backspaces >= game.maxBackspaces ? 'text-red-400' : 'text-yellow-400'}>
            Backspaces: {game.backspaces}/{game.maxBackspaces}
          </div>
          <div>WPM: {game.wpm}</div>
        </div>

        {/* Typing area */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6 min-h-32">
          <div className="whitespace-pre-wrap leading-relaxed">
            {renderSentence()}
          </div>
        </div>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full p-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Start typing..."
          autoFocus
        />

        {/* Instructions */}
        <div className="mt-6 text-gray-400 text-sm">
          <p>Type the sentence exactly as shown above</p>
          <p>Backspaces remaining: {game.maxBackspaces - game.backspaces}</p>
          {game.backspaces >= game.maxBackspaces && (
            <p className="text-yellow-400">No backspaces left - errors will count now!</p>
          )}
        </div>
      </div>
    </div>
  );
}