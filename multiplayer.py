from game import PlayerState, SentenceGenerator
import time

class MultiplayerGameSession:
    def __init__(self):
        self.players = {}  # player_id -> PlayerState
        self.started = False
        self.ready_players = set()

    def start_game(self):
        if len(self.players) < 2:
            raise Exception('You must have at least 2 players')
        self.started = True

    def is_game_started(self):
        return self.started

    def add_player(self, player_id: str):
        self.players[player_id] = PlayerState()

    def get_player(self, player_id: str) -> PlayerState:
        return self.players.get(player_id)

    def all_players_ready(self):
        if len(self.players) < 2:
            return False
        return all(p.ready for p in self.players.values())

    def mark_ready(self, player_id: str):
        player = self.players.get(player_id)
        if player:
            player.mark_ready()
        return self.all_players_ready()

    def submit_typing(self, player_id: str, typed: str, is_backspace=False):
        player = self.players[player_id]
        if not player.current_sentence:
            raise ValueError("No current sentence")

        target = player.current_sentence

        if is_backspace:
            player.current_backspaces += 1

        new_errors = 0
        if player.current_backspaces >= player.max_backspaces:
            prev_len = len(player.previous_input)
            for i in range(prev_len, min(len(typed), len(target))):
                if typed[i] != target[i]:
                    new_errors += 1

        player.previous_input = typed
        player.current_errors += new_errors

        correct = typed.strip() == target.strip()
        completed = len(typed) == len(target)
        garbage_targets = []

        if completed:
            if correct:
                player.current_sentence = ""
                player.streak += 1
                if player.streak > 3:
                    now = time.time()
                    for pid, other in self.players.items():
                        if pid != player_id:
                            other.garbage_warning_time = now + 1.5
                            other.incoming_garbage = True
                            garbage_targets.append(pid)
                    player.streak = 0  # Reset streak after attack

        if player.is_game_over() and not player.eliminated:
            player.eliminated = True


        # Check for last player
        alive_players = [pid for pid, p in self.players.items() if not p.eliminated]
        winner_id = None
        if len(alive_players) == 1:
            winner_id = alive_players[0]

        result = {
            "correct": correct,
            "completed": completed,
            "errors": player.current_errors,
            "backspaces": player.current_backspaces,
            "incoming_garbage": player.incoming_garbage,
            "difficulty": player.difficulty_level,
            "streak": player.streak,
            "game_over": player.is_game_over(),
            "garbage_targets": garbage_targets
        }

        if winner_id:
            result['winner'] = winner_id

        return result
