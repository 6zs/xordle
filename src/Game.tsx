import { useEffect, useRef, useState } from "react";
import { Row, RowState } from "./Row";
import dictionary from "./dictionary.json";
import { Clue, clue, describeClue, xorclue } from "./clue";
import { Keyboard } from "./Keyboard";
import targetList from "./targets.json";
import {
  gameName,
  pick,
  resetRng,
  speak,
  dayNum
} from "./util";

enum GameState {
  Playing,
  Won,
  Lost,
}

function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (value: T | ((t: T) => T)) => void] {
  const [current, setCurrent] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch (e) {
      return initial;
    }
  });
  const setSetting = (value: T | ((t: T) => T)) => {
    try {
      const v = value instanceof Function ? value(current) : value;
      setCurrent(v);
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch (e) {}
  };
  return [current, setSetting];
}

interface GameProps {
  maxGuesses: number;
  hidden: boolean;
  colorBlind: boolean;
  keyboardLayout: string;
}

const targets = targetList.slice(0, targetList.indexOf("murky") + 1); // Words no rarer than this one
const minLength = 4;
const defaultLength = 5;
const maxLength = 11;
const limitLength = (n: number) =>
  n >= minLength && n <= maxLength ? n : defaultLength;

function isValidCluePair(word1: string, word2: string) {
  if (/\*/.test(word1)) {
    return false;
  }
  if (/\*/.test(word2)) {
    return false;
  }
  if (word1.length !== word2.length) {
    return false;
  }
  if (word1 === word2) {
    return false;
  }
  for (let i = 0; i < word1.length; ++i) {
    if(word1[i] === word2[i]) {
      return false;
    }
    if (word2.search(word1[i]) !== -1) {
      return false;
    }
  }
  return true;
}

function randomTargets(wordLength: number): string[] {
  const eligible = targets.filter((word) => word.length === wordLength);
  let candidate1: string;
  let candidate2: string;
  do {
    candidate1 = pick(eligible);
    candidate2 = pick(eligible);
  } while (!isValidCluePair(candidate1,candidate2));
  return [candidate1, candidate2];
}

function Game(props: GameProps) {
  const [gameState, setGameState] = useState(GameState.Playing);
  const [guesses, setGuesses] = useLocalStorage<string[]>("guesses-day-"+dayNum, []);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const wordLength = 5;
  const [targets, setTargets] = useState(() => {
    resetRng();
    return randomTargets(wordLength);
  });
  const [hint, setHint] = useState<string>(
     `Make your first guess!`
  );
  const tableRef = useRef<HTMLTableElement>(null);
  async function share(copiedHint: string, text?: string) {
    const url = window.location.origin + window.location.pathname;
    const body = (text ? text + "\n" : "") + url;
    if (
      /android|iphone|ipad|ipod|webos/i.test(navigator.userAgent) &&
      !/firefox/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({ text: body });
        return;
      } catch (e) {
        console.warn("navigator.share failed:", e);
      }
    }
    try {
      await navigator.clipboard.writeText(body);
      setHint(copiedHint);
      return;
    } catch (e) {
      console.warn("navigator.clipboard.writeText failed:", e);
    }
    setHint(url);
  }

  const onKey = (key: string) => {
    if (gameState !== GameState.Playing) {
      return;
    }
    if (guesses.length === props.maxGuesses) return;
    if (/^[a-z]$/i.test(key)) {
      setCurrentGuess((guess) =>
        (guess + key.toLowerCase()).slice(0, wordLength)
      );
      tableRef.current?.focus();
      setHint("");
    } else if (key === "Backspace") {
      setCurrentGuess((guess) => guess.slice(0, -1));
      setHint("");
    } else if (key === "Enter") {
      if (currentGuess.length !== wordLength) {
        setHint("Too short");
        return;
      }
      if (!dictionary.includes(currentGuess)) {
        setHint("Not a valid word");
        return;
      }
     
      setGuesses((guesses) => guesses.concat([currentGuess]));
      setCurrentGuess((guess) => "");

      const gameOver = (verbed: string) =>
        `You ${verbed}! The answers were ${targets[0].toUpperCase()}, ${targets[1].toUpperCase()}. Play again tomorrow!`;

      if (currentGuess === targets[0] || currentGuess === targets[1]) {
        setHint(gameOver("won"));
        setGameState(GameState.Won);
      } else if (guesses.length + 1 === props.maxGuesses) {
        setHint(gameOver("lost"));
        setGameState(GameState.Lost);
      } else {
        setHint("");
        speak(describeClue(clue(currentGuess, targets[0])));
        speak(describeClue(clue(currentGuess, targets[1])));
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        onKey(e.key);
      }
      if (e.key === "Backspace") {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [currentGuess, gameState]);

  let letterInfo = new Map<string, Clue>();
  const tableRows = Array(props.maxGuesses)
    .fill(undefined)
    .map((_, i) => {
      const guess = [...guesses, currentGuess][i] ?? "";
      const cluedLetters = xorclue(clue(guess, targets[0]),clue(guess, targets[1]));
      const lockedIn = i < guesses.length;
      if (lockedIn) {
        for (const { clue, letter } of cluedLetters) {
          if (clue === undefined) break;
          const old = letterInfo.get(letter);
          if (old === undefined || clue > old) {
            letterInfo.set(letter, clue);
          }
        }
      }
      return (
        <Row
          key={i}
          wordLength={wordLength}
          rowState={
            lockedIn
              ? RowState.LockedIn
              : i === guesses.length
              ? RowState.Editing
              : RowState.Pending
          }
          cluedLetters={cluedLetters}
        />
      );
    });

  return (
    <div className="Game" style={{ display: props.hidden ? "none" : "block" }}>
      <div className="Game-options">
        <button
          style={{ flex: "0 0 auto" }}
          disabled={gameState !== GameState.Playing || guesses.length === 0}
          onClick={() => {
            setHint(
              `The answers were ${targets[0].toUpperCase()}, ${targets[1].toUpperCase()}.`
            );
            setGameState(GameState.Lost);
            (document.activeElement as HTMLElement)?.blur();
          }}
        >
          Give up
        </button>
      </div>
      <table
        className="Game-rows"
        tabIndex={0}
        aria-label="Table of guesses"
        ref={tableRef}
      >
        <tbody>{tableRows}</tbody>
      </table>
      <p
        role="alert"
        style={{
          userSelect: /https?:/.test(hint) ? "text" : "none",
          whiteSpace: "pre-wrap",
        }}
      >
        {hint || `\u00a0`}
      </p>
      <Keyboard
        layout={props.keyboardLayout}
        letterInfo={letterInfo}
        onKey={onKey}
      />
      <p>
        {" "}
        {gameState !== GameState.Playing && (
          <button
            onClick={() => {
              const emoji = props.colorBlind
                ? ["⬛", "🟦", "🟧"]
                : ["⬛", "🟨", "🟩"];
              const score = gameState === GameState.Lost ? "X" : guesses.length;
              share(
                "Result copied to clipboard!",
                `${gameName} #${dayNum} ${score}/${props.maxGuesses}\n` +
                  guesses
                    .map((guess) =>
                      xorclue(clue(guess, targets[0]),clue(guess, targets[1]))
                        .map((c) => emoji[c.clue ?? 0])
                        .join("")
                    )
                    .join("\n")
              );
            }}
          >
            Share emoji results
          </button>
        )}
      </p>
    </div>
  );
}

export default Game;
