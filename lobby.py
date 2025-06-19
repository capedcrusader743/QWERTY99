import uuid
from multiplayer import MultiplayerGameSession

class LobbyManager:
    def __init__(self):
        self.rooms = {}  # room_id -> MultiplayerGameSession

    def create_room(self):
        room_id = str(uuid.uuid4())
        self.rooms[room_id] = MultiplayerGameSession()
        return room_id

    def join_room(self, room_id: str, player_id: str):
        if room_id not in self.rooms:
            raise ValueError("Room not found")
        self.rooms[room_id].add_player(player_id)

    def leave_room(self, room_id: str, player_id: str):
        if room_id in self.rooms:
            game = self.rooms[room_id]
            if player_id in game.players:
                del game.players[player_id]
            if len(game.players) == 0:
                del self.rooms[room_id]

    def room_exists(self, room_id: str) -> bool:
        return room_id in self.rooms

    def get_game(self, room_id: str) -> MultiplayerGameSession:
        if room_id not in self.rooms:
            raise ValueError("Room not found")
        return self.rooms[room_id]
