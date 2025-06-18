import time
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from lobby import LobbyManager

app = FastAPI()
lobby = LobbyManager()
active_connections = {}

origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    "https://qwerty99.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==== Data Models ====

class CreateRoomResponse(BaseModel):
    room_id: str

class JoinRoomRequest(BaseModel):
    room_id: str
    player_id: str

class SentenceRequest(BaseModel):
    room_id: str
    player_id: str

class SubmitRequest(BaseModel):
    room_id: str
    player_id: str
    typed: str
    backspace: bool = False

# ==== API Endpoints ====

@app.post("/room/create", response_model=CreateRoomResponse)
def create_room():
    room_id = lobby.create_room()
    return {"room_id": room_id}

@app.post("/room/join")
def join_room(data: JoinRoomRequest):
    try:
        lobby.join_room(data.room_id, data.player_id)
        return {"message": f"Player {data.player_id} joined room {data.room_id}"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/room/start")
def start_game(room_id: str):
    game = lobby.get_game(room_id)
    try:
        game.start_game()
        return {"message": "Game started"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/room/sentence")
def get_sentence(data: SentenceRequest):
    try:
        game = lobby.get_game(data.room_id)
        player = game.get_player(data.player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")

        if not game.is_game_started():
            raise HTTPException(status_code=403, detail="Game not started yet")

        sentence = player.get_next_sentence()
        return {
            "sentence": sentence,
            "level": player.difficulty_level
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/submit")
def submit_typing(data: SubmitRequest):
    try:
        game = lobby.get_game(data.room_id)
        result = game.submit_typing(
            player_id=data.player_id,
            typed=data.typed,
            is_backspace=data.backspace
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    await websocket.accept()

    if room_id not in active_connections:
        active_connections[room_id] = {}
    active_connections[room_id][player_id] = websocket

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            # === Heartbeat ===
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            # === Typing Update ===
            elif msg_type == "typing":
                text = data.get("typed", "")
                for pid, conn in active_connections[room_id].items():
                    if pid != player_id:
                        await conn.send_json({
                            "type": "typing_update",
                            "player_id": player_id,
                            "text": text
                        })

            # === Submit Typing ===
            elif msg_type == "submit":
                typed = data.get("typed", "")
                backspace = data.get("backspace", False)

                game = lobby.get_game(room_id)
                result = game.submit_typing(player_id, typed, is_backspace=backspace)

                # Send submit result back to sender
                await websocket.send_json({
                    "type": "submit_result",
                    "result": result
                })

                # Notify others of sentence completion
                if result["completed"] and result["correct"]:
                    for pid, conn in active_connections[room_id].items():
                        if pid != player_id:
                            await conn.send_json({
                                "type": "sentence_complete",
                                "player_id": player_id
                            })

                # Garbage attack
                if "garbage_targets" in result:
                    for target_id in result["garbage_targets"]:
                        if target_id in active_connections[room_id]:
                            await active_connections[room_id][target_id].send_json({
                                "type": "garbage_attack",
                                "from": player_id
                            })

                # Game over
                if result["game_over"]:
                    for pid, conn in active_connections[room_id].items():
                        await conn.send_json({
                            "type": "player_eliminated",
                            "player_id": player_id
                        })

                # Winner
                if "winner" in result:
                    for pid, conn in active_connections[room_id].items():
                        await conn.send_json({
                            "type": "winner",
                            "player_id": result["winner"]
                        })

            # === Ready Notice ===
            elif msg_type == "ready":
                game = lobby.get_game(room_id)
                should_start = game.mark_ready(player_id)

                # Notify other players that this player is ready
                for pid, conn in active_connections[room_id].items():
                    if pid != player_id:
                        await conn.send_json({
                            "type": "ready",
                            "player_id": player_id
                        })

                # If all players are ready, start the game
                if should_start and not game.is_game_started():
                    game.start_game()
                    for conn in active_connections[room_id].values():
                        await conn.send_json({
                            "type": "start_game"
                        })

    except WebSocketDisconnect:
        del active_connections[room_id][player_id]
        if not active_connections[room_id]:
            del active_connections[room_id]
        else:
            for pid, conn in active_connections[room_id].items():
                await conn.send_json({
                    "type": "player_left",
                    "player_id": player_id
                })

    # For debugging
    except Exception as e:
        print(f"[WebSocket Error] Player {player_id} in room {room_id}: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


