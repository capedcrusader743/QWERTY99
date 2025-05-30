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
        return self.current_errors >= self.max_errors or self.current_backspaces >= self.max_backspaces

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

    # def type_sentence(self, target):
    #     print(f"Type this: {target}")
    #     print(f"(Allowed: {self.max_errors} errors, {self.max_backspaces} backspaces)\n")
    #     print(f"(Current errors: {self.current_errors} errors, {self.current_backspaces} backspaces)\n")
    #     typed = ""
    #
    #     while len(typed) < len(target):
    #         char = getch().decode('utf-8')
    #
    #         if char in ('\x08', '\x7f'): #Handle backspace
    #             if typed:
    #                 typed = typed[:-1]
    #                 self.increment_backspaces()
    #         else:
    #             typed += char
    #             if char != target[len(typed) - 1] and self.current_backspaces == self.max_backspaces:
    #                 self.increment_errors()
    #
    #         print(f"\rTyped: {typed}{' ' * (len(target) - len(typed))}", end='')
    #
    #         if self.current_errors >= self.max_errors or self.current_backspaces >= self.max_backspaces:
    #             print("\n Game Over: Reached limits.")
    #             return False
    #
    #     print("\n Sentence completed!")
    #     return True

    def submit_typing(self, typed_input: str):
        if not self.current_sentence:
            raise ValueError("No current sentence yet")

        target = self.current_sentence
        is_correct = typed_input.strip() == target.strip()

        # Calculate new errors (only if out of backspaces)
        new_errors = 0
        if self.current_backspaces >= self.max_backspaces:
            for i in range(min(len(typed_input), len(target))):
                if typed_input[i] != target[i]:
                    new_errors += 1

        # Update state
        self.current_errors += new_errors

        return {
            "correct": is_correct,
            "errors": self.current_errors,
            "backspaces": self.current_backspaces,
            "game_over": self.is_game_over(),
            "difficulty_level": self.difficulty_level
        }

    # def game_loop(self):
    #     input("Press enter to begin...\n")
    #     self.start_time = time.time()
    #
    #     while not self.is_game_over():
    #         self.update_difficulty()
    #         sentence = self.get_next_sentence()
    #         print(f"\nLevel {self.difficulty_level}")
    #         result = self.type_sentence(sentence)
    #
    #         if not result:
    #             break

# if __name__ == "__main__":
#     game = GameState()
#     game.game_loop()

games: Dict[str, GameState] = {}

def create_new_game():
    game_id = str(uuid.uuid4())
    games[game_id] = GameState()
    return game_id

def get_game(game_id: str) -> GameState:
    return games.get(game_id)