import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  incomingGarbage?: boolean;
  streak?: number;
}

export default function TypeGame() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room_id");
  const playerId = searchParams.get("player_id");
  const navigate = useNavigate();

  if (!roomId || !playerId) {
    return <div className="text-red-500 text-center">Missing room ID or player ID in URL.</div>;
  }

  const [game, setGame] = useState<GameState | null>(null);
  const [input, setInput] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [incomingGarbage, setIncomingGarbage] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  // const [otherPlayersTyping, setOtherPlayersTyping] = useState<{ [id: string]: string }>({});
  const [gameStarted, setGameStarted] = useState(false);
  const [isReady, setReady] = useState(false);
  const [waitingToStart, setWaitingToStart] = useState(true);
  const [otherPlayersTyping, setOtherPlayersTyping] = useState<{ [id: string]: { input: string; sentence: string} }>({});

  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousInputLength = useRef(0);

  const initializeMultiplayerGame = async () => {
    try {
      setLoading(true);

      await fetch('https://qwerty99.onrender.com/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, player_id: playerId }),
      });

      const res = await fetch('https://qwerty99.onrender.com/room/sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, player_id: playerId }),
      });
      const { sentence, level } = await res.json();

      if (!sentence) {
        setError("Failed to receive sentence from server.");
        setLoading(false);
        return;
      }

      setGame({
        gameId: roomId,
        sentence,
        difficulty: level,
        errors: 0,
        backspaces: 0,
        maxErrors: 5,
        maxBackspaces: 5,
        wpm: 0,
        startTime: Date.now(),
        streak: 0
      });

      setWaitingToStart(false);
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize game', err);
      setError('Failed to join or start game.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameStarted) {
      initializeMultiplayerGame();
    }
  }, [gameStarted]);

  useEffect(() => {
    if (!roomId || !playerId) return;

    const ws = new WebSocket(`wss://qwerty99.onrender.com/ws/${roomId}/${playerId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'typing_update') {
        setOtherPlayersTyping(prev => ({
          ...prev,
          [data.player_id]: {
            input: data.input,
            sentence: data.sentence
          }
        }));
      } else if (data.type === 'garbage_attack') {
        setIncomingGarbage(true);
      } else if (data.type === 'game_over') {
        if (data.player_id === playerId) {
          setGameOver(true);
        }
      } else if (data.type === 'winner') {
        setWinner(data.player_id);
        setGameOver(true);
      } else if (data.type === 'start_game') {
        console.log("Game is starting...");
        setGameStarted(true);
      } else if (data.type === 'ready') {
        console.log(`Player ${data.player_id} is ready.`);
      }
    };

    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, [roomId, playerId]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!game) return;
    const newValue = e.target.value;
    const isBackspace = newValue.length < input.length;

    setInput(newValue);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        player_id: playerId,
        input: newValue
      }));
    }

    try {
      const response = await fetch('https://qwerty99.onrender.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          player_id: playerId,
          typed: newValue,
          backspace: isBackspace
        })
      });

      const result = await response.json();

      setGame(prev => ({
        ...prev!,
        errors: result.errors,
        backspaces: isBackspace ? prev!.backspaces + 1 : prev!.backspaces,
        streak: result.streak ?? prev!.streak
      }));

      if (result.game_over) {
        setGameOver(true);
        return;
      }

      if (result.completed) {
        const wpm = (() => {
          if (!game.startTime) return 0;
          const words = game.sentence.split(' ').length;
          const minutes = (Date.now() - game.startTime) / 60000;
          return Math.round(words / minutes);
        })();

        const fetchNewSentence = async () => {
          let data = null;
          while (!data || !data.sentence) {
            const r = await fetch('https://qwerty99.onrender.com/room/sentence', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ room_id: roomId, player_id: playerId }),
            });
            data = await r.json();
            if (!data.sentence) await new Promise((res) => setTimeout(res, 200));
          }
          return data;
        };

        if (result.incoming_garbage) {
          setIncomingGarbage(true);
          setTimeout(async () => {
            const { sentence, level } = await fetchNewSentence();
            setGame(prev => ({
              ...prev!,
              sentence,
              difficulty: level,
              wpm,
              startTime: Date.now(),
              backspaces: prev!.backspaces,
              errors: prev!.errors,
            }));
            setInput('');
            setIncomingGarbage(false);
          }, 1500);
        } else {
          const { sentence, level } = await fetchNewSentence();
          setGame(prev => ({
            ...prev!,
            sentence,
            difficulty: level,
            wpm,
            startTime: Date.now(),
            backspaces: prev!.backspaces,
            errors: prev!.errors,
          }));
          setInput('');
        }
      }
    } catch (err) {
      console.error('Error submitting input:', err);
    }

    previousInputLength.current = newValue.length;
  };

  // const renderSentence = () => {
  //   if (!game) return null;
  //   return game.sentence.split('').map((char, i) => {
  //     let className = 'text-gray-400';
  //     if (i < input.length) {
  //       className = input[i] === char
  //         ? 'text-green-500'
  //         : game.backspaces >= game.maxBackspaces
  //           ? 'text-red-500 underline'
  //           : 'text-yellow-500';
  //     }
  //     return (
  //       <span key={i} className={`${className} text-2xl font-mono`}>
  //         {char}
  //       </span>
  //     );
  //   });
  // };

  function renderHighlightedSentence(sentence: string, input: string, backspacesUsed = 0, maxBackspaces = 5) {
    return sentence.split('').map((char, i) => {
      let className = 'text-gray-400';

      if (i < input.length) {
        className = input[i] === char
          ? 'text-green-400'
          : backspacesUsed >= maxBackspaces
            ? 'text-red-500 underline'
            : 'text-yellow-500';
      }

      const showCursor = i === input.length;

      return (
        <span key={i} className={`${className} relative`}>
          {char}
          {showCursor && <span className="absolute animate-pulse left-0 -bottom-1 w-0.5 h-4 bg-blue-500" />}
        </span>
      );
    });
  }


  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (waitingToStart && !gameStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-3xl mb-4">Waiting Room</h2>
        <p className="text-gray-400 mb-4">Once all players are ready, the game will begin.</p>
        <p className="text-blue-400 mb-2 text-lg">
          Room Code: <code className="bg-gray-800 px-2 py-1 rounded">{roomId}</code>
        </p>

        {!isReady ? (
          <button
            onClick={() => {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ready', player_id: playerId }));
                setReady(true);
              }
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            I'm Ready
          </button>
        ) : (
          <p className="text-green-400">You are ready! Waiting for others...</p>
        )}
      </div>
    );
  }

  if (loading) return <div className="text-white text-center">Loading game...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!game) return <div className="text-white text-center">Game not initialized</div>;

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <h1 className="text-4xl mb-4">
          {winner === playerId
            ? <span className="text-green-400">You Win!</span>
            : <span className="text-red-500">Game Over!</span>}
        </h1>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(otherPlayersTyping).map(([id, data]) => {
            if (id === playerId) return null;

            const { input, sentence } = data;
            return (
              <div key={id} className="bg-gray-800 p-3 rounded text-sm text-white shadow-md border border-blue-500">
                <p className="mb-1 text-xs text-blue-400 font-semibold">Player: {id}</p>
                <div className="whitespace-pre-wrap font-mono text-xs">
                  <p>Hello</p>
                  {renderHighlightedSentence(sentence, input)}
                    {/*{sentence.split('').map((char, i) => {*/}
                    {/*  const typedChar = input[i];*/}
                    {/*  let color = 'text-gray-400';*/}

                    {/*  if (typedChar !== undefined) {*/}
                    {/*    color = typedChar === char ? 'text-green-400' : 'text-red-400';*/}
                    {/*  }*/}

                    {/*  const showCursor = i === input.length;*/}

                    {/*  return (*/}
                    {/*    <span key={i} className={`${color} relative`}>*/}
                    {/*      {char}*/}
                    {/*      {showCursor && <span className="absolute animate-pulse left-0 -bottom-1 w-0.5 h-4 bg-blue-500" />}*/}
                    {/*    </span>*/}
                    {/*  );*/}
                    {/*})}*/}
                </div>
              </div>
            );
          })}
        </div>
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

        {incomingGarbage && (
          <div className="text-red-500 text-center text-lg font-semibold mb-4 animate-pulse">
            Garbage sentence incoming!
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg mb-6 min-h-32">
          <div className="whitespace-pre-wrap leading-relaxed">
            {/*{renderSentence()}*/}
            {game && renderHighlightedSentence(game.sentence, input, game.backspaces, game.maxBackspaces)}
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full p-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Start typing..."
          autoFocus
        />

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
