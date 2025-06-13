import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./game_components/Home"
import TypeGame from "./game_components/TypeGame.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/game" element={<TypeGame />} />
      </Routes>
    </Router>
  )
}

export default App
