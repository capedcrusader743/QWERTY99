from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from game import GameState

app = FastAPI()

# Initialize game state
game_states = {}

origins = [
    "http://localhost:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/")
# async def root():
#     return {"message": "Hello World"}
#
#
# @app.get("/api")
# async def api_root():
#     return {"message": "Hello from /api"}

@app.post("/api/new-game")
async def new_game():
    """Initialize a new game session"""
    game = GameState()
    session_id = str(len(game_states)+1)
    game_states[session_id] = game
    return {"session_id": session_id}

@app.post("/api/get-sentence")
async def get_sentence(request: Request):
    """Get next sentence for current difficulty"""
    try:
        data = await request.json()
        session_id = data["session_id"]
        game = game_states[session_id]

        game.update_difficulty() # Auto-update based on time
        sentence = game.get_next_sentence()

        return {
            "sentence": sentence,
            "difficulty": game.difficulty_level,
            "errors_left": game.max_errors - game.current_errors,
            "backspaces_left": game.max_backspaces - game.current_backspaces
        }
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid request")

@app.post("/api/check-input")
async def check_input(request: Request):
    """Validate user input against current sentence"""
    data = await request.json()
    session_id = data["session_id"]
    input_text = data["input"]

    game = game_states[session_id]
    target = game.get_next_sentence() # Gets current sentence again



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


