import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
// @ts-ignore
import TypeWriterEffect from 'react-typewriter-effect';

const Home = () => {
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleStart = async () => {
    try {
      let actualRoomId = roomId;

      // If no roomId provided, create one
      if (!actualRoomId) {
        const res = await fetch('http://18.234.100.144:8000/room/create', { method: 'POST' });
        const data = await res.json();
        actualRoomId = data.room_id;
      }

      // Join the room
      await fetch('http://18.234.100.144:8000/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: actualRoomId, player_id: playerId })
      });

      // Navigate to game with room and player ID
      navigate(`/game?room_id=${actualRoomId}&player_id=${playerId}`);
    } catch (err) {
      alert('Failed to start or join a room');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-mono">QWERTY99</h1>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-white/20 space-y-4">
          <TypeWriterEffect
            textStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '1.25rem', color: 'white', fontWeight: 400 }}
            startDelay={200}
            cursorColor="#ffffff"
            multiText={[
              'Welcome to the ultimate typing challenge',
              'Compete against others in real-time',
              'Click start to join a game',
            ]}
            multiTextDelay={1000}
            typeSpeed={40}
            multiTextLoop={true}
          />

          <input
            type="text"
            placeholder="Enter your player name"
            className="w-full p-2 rounded text-black"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          />

          <input
            type="text"
            placeholder="Enter room ID (leave blank to create one)"
            className="w-full p-2 rounded text-black"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button
            onClick={handleStart}
            disabled={!playerId}
            className="w-full mt-2 px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 text-lg"
          >
            Start Race
          </button>
        </div>

        <div className="mt-12 text-white/70 text-sm">
          <p>Test your typing speed against players worldwide</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
