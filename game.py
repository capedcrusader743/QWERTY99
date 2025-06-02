import time
import random
import uuid
# from msvcrt import getch
from typing import Dict

class GameState:

    sentences = {1: ["The sun is bright today",
                     "She loves to read books",
                     "Cats and dogs are pets",
                     "I have a red apple",
                     "Run fast and jump high",
                     "The dog barks loudly",
                     "Fish swim in water",
                     "They play soccer outside"],
                 2: ["Quickly typing improves your speed and accuracy over time",
                     "The lazy brown fox slept under the old oak tree",
                     "Programming requires logic, patience, and creativity",
                     "She traveled to Paris last summer and visited the Louvre",
                     "The scientist carefully recorded the experimental results",
                     "The quick brown fox jumps over the lazy fox",
                     "He finished his homework before playing video games",
                     "Reading books help expand your knowledge and imagination"],
                 3: ["Exponential growth demands scalable infrastructure",
                     "The enigmatic philosopher pondered existential quandaries under starlight",
                     "JavasScript's event loop handles asynchronous callbacks non-blockingly",
                     "Quantum entanglement defies classical physics' locality principle",
                     "The relentless entrepreneur pivoted her startup toward disruptive innovation",
                     "The entrepreneur launched a disruptive blockchain startup",
                     "Neural networks require massive datasets for training",
                     "Excessive screen time may impair cognitive development in children",
                     "Her thesis analyzed postmodern literature's cultural influence"],
                 4: ["The password is p@ssw0rd$ecur1ty!",
                     "React's useState() Hook manages component state",
                     "C++ supports OOP, templates, and lambda expressions"]}

    def __init__(self):
        self.max_errors = 5
        self.max_backspaces = 5
        self.current_errors = 0
        self.current_backspaces = 0
        self.start_time = time.time()
        self.difficulty_level = 1
        self.current_sentence = ""
        self.previous_input = ""

    def get_next_sentence(self):
        # sentences = self.sentences.get(self.difficulty_level, [])
        # return random.choice(sentences) if sentences else "No more sentences"
        self.update_difficulty()
        try:
            self.current_sentence = random.choice(self.sentences[self.difficulty_level])
        except (KeyError, IndexError):
            raise ValueError("No sentences available for current difficulty level")
        return self.current_sentence

    def increment_errors(self):
        self.current_errors += 1

    def increment_backspaces(self):
        self.current_backspaces += 1

    def is_game_over(self):
        return (self.current_errors + self.current_backspaces) >= 10

    def update_difficulty(self):
        elapsed_time = time.time() - self.start_time
        if elapsed_time > 90:
            self.difficulty_level = 4
        elif elapsed_time > 60:
            self.difficulty_level = 3
        elif elapsed_time > 30:
            self.difficulty_level = 2
        else:
            self.difficulty_level = 1

    def submit_typing(self, typed_input: str, is_backspace=False):
        if not self.current_sentence:
            raise ValueError("No current sentence yet")

        target = self.current_sentence

        if is_backspace:
            if self.current_backspaces < self.max_backspaces:
                self.increment_backspaces()

        new_errors = 0
        if self.current_backspaces >= self.max_backspaces:
            prev_len = len(self.previous_input)
            for i in range(prev_len, min(len(typed_input), len(target))):
                if typed_input[i] != target[i]:
                    new_errors += 1

        self.previous_input = typed_input
        self.current_errors += new_errors

        return {
            "correct": typed_input.strip() == target.strip(),
            "completed": len(typed_input) == len(target),
            "errors": self.current_errors,
            "backspaces": self.current_backspaces,
            "game_over": self.is_game_over(),
            "difficulty_level": self.difficulty_level
        }


games: Dict[str, GameState] = {}

def create_new_game():
    game_id = str(uuid.uuid4())
    games[game_id] = GameState()
    return game_id

def get_game(game_id: str) -> GameState:
    return games.get(game_id)