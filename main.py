from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from game import create_new_game, get_game
from pydantic import BaseModel

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

class InputModel(BaseModel):
    game_id: str
    typed: str

@app.post("/start")
def start_game():
    game_id = create_new_game()
    return {"game_id": game_id}

@app.get("/sentence/{game_id}")
def next_sentence(game_id: str):
    game = get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    sentence = game.get_next_sentence()
    return {"sentence": sentence, "level": game.difficulty_level}

@app.post("/submit")
def submit(input_data: InputModel):
    game = get_game(input_data.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    result = game.submit_typing(input_data.typed)
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


