import { useNavigate } from 'react-router-dom';
// @ts-ignore
import TypeWriterEffect from 'react-typewriter-effect';

const Home = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-mono">
          QWERTY99
        </h1>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-white/20">
          <TypeWriterEffect
            textStyle={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '1.25rem',
              color: 'white',
              fontWeight: 400,
            }}
            startDelay={200}
            cursorColor="#ffffff"
            multiText={[
              'Welcome to the ultimate typing challenge',
              'Compete against others in real-time',
              'Click start to join a game',
            ]}
            multiTextDelay={1000}
            typeSpeed={40}
            multiTextLoop={true}  // This enables looping
          />

          <button
            onClick={handleStart}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 text-lg"
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