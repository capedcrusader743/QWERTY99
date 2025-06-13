import time
import random

class SentenceGenerator:

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

    @staticmethod
    def get_sentence(level: int):
        return random.choice(SentenceGenerator.sentences[level])

    @staticmethod
    def generate_garbage(level: int):
        base = SentenceGenerator.get_sentence(min(level + 1, 4))
        words = base.split()
        if words:
            i = random.randint(0, len(words) - 1)
            words[i] = ''.join(random.sample(words[i], len(words[i]))) + "!?$"
        return ' '.join(words)

class PlayerState:

    def __init__(self):
        self.current_errors = 0
        self.current_backspaces = 0
        self.max_errors = 5
        self.max_backspaces = 5
        self.difficulty_level = 1
        self.current_sentence = ""
        self.previous_input = ""
        self.start_time = time.time()
        self.incoming_garbage = False
        self.garbage_warning_time = None
        self.streak = 0
        self.live_input = ""
        self.eliminated = False

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

    def get_next_sentence(self):
        self.update_difficulty()
        now = time.time()
        if self.incoming_garbage and now >= (self.garbage_warning_time or 0):
            self.incoming_garbage = False
            self.current_sentence = SentenceGenerator.generate_garbage(self.difficulty_level)

        if not self.current_sentence:
            self.current_sentence = SentenceGenerator.get_sentence(self.difficulty_level)

        print(f"[{time.time()}] Next sentence: {self.current_sentence}")
        print("Choosing from pool:", SentenceGenerator.sentences[self.difficulty_level])

        return self.current_sentence

    def is_game_over(self):
        return self.current_errors > self.max_errors or self.current_backspaces > self.max_backspaces


