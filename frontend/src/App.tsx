import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./game_components/Home"
import TypeGame from "./game_components/TypeGame.tsx";
// import GameOver from "./game_components/GameOver.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/game" element={<TypeGame />} />
          {/*<Route path="/game-over" element={<GameOver />} />*/}
      </Routes>
    </Router>
  )
}

export default App
