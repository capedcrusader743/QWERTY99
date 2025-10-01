# QWERTY 99 🎮⌨️

A real-time multiplayer typing game inspired by **Tetris 99**, built with **FastAPI, WebSockets, and React**. Players race to complete sentences while sabotaging opponents with “garbage text” attacks based on performance streaks.

---

## 🚀 Features

* **Real-time Multiplayer**: Built with WebSockets for low-latency, bi-directional communication.
* **Dynamic Gameplay**:

  * Mistake-based knockout system – exceed error limits and you’re out!
  * “Garbage text” attacks disrupt opponents, adding competitive strategy.
* **Lobby System**: Players can join rooms, mark readiness, and auto-start games when all are ready.
* **Live UI Sync**: See opponent progress in real-time with Tetris 99–style mini player screens.
* **Scalable Architecture**: Backend handles multiple concurrent game rooms with independent states.

---

## 🛠️ Tech Stack

**Frontend**: React, TypeScript, WebSockets, TailwindCSS
**Backend**: FastAPI, Python, WebSockets
**Database (optional)**: PostgreSQL or SQLite (for persistence)
**Deployment**: Docker, Render (backend), Vercel (frontend)

---

## ⚡ Getting Started

### Prerequisites

* Node.js (v16+)
* Python 3.10+
* Docker (optional, for containerized setup)

### Clone the Repo

```bash
git clone https://github.com/yourusername/qwerty99.git
cd qwerty99
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:3000`

---

## 🎯 How to Play

1. Enter a room code or create a new game room.
2. Type the displayed sentence as fast and accurately as possible.
3. Each streak sends **garbage text** to opponents.
4. Last typist standing wins!

---

## 🧠 Key Challenges Solved

* Designed **real-time state sync** across multiple players using FastAPI WebSockets.
* Built **event-driven attack logic** to simulate competitive sabotage.
* Implemented **mini player UIs** to visualize opponent progress in real time.
* Balanced **game difficulty scaling** with player performance.

---

## 🌍 Roadmap

* [ ] Add ranking/leaderboard system
* [ ] Persistent user profiles
* [ ] Mobile-friendly UI
* [ ] AI bot opponents for solo practice

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to add.

---
