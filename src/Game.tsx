import { useEffect, useRef, useState } from "react";
import { Row, RowState } from "./Row";
import dictionary from "./dictionary.json";
import { Clue, clue, CluedLetter, describeClue, xorclue } from "./clue";
import { Keyboard } from "./Keyboard";
import { PopUp } from "./PopUp"
import targetList from "./targets.json";
import {
  gameName,
  pick,
  speak,
  practice,
  dayNum,
  todayDayNum,
  cheat,
  maxGuesses,
  makeRandom,
  urlParam,
  isDev,
  nightmare,
  instant,
  needResetPractice,
  currentSeed,
  day1Date,
  research,
} from "./util";

import { hardCodedPuzzles } from "./hardcoded";
import { hardCodedPractice } from "./hardcoded_practice";
import cheatyface from "./cheatyface.json";
import { Day, RawStats } from "./Stats"
import { nightmares } from "./nightmares";
import { instants } from "./instants";
import { readOnly, serializeStorage } from "./App";
import { GetDaySpoilers } from "./Gallery";

export enum GameState {
  Playing,
  Won,
  Lost,
}

declare const GoatEvent: Function;
declare const checkVersion: Function;

export const gameDayStoragePrefix = "result-";
export const hardModeStoragePrefix = "hard-mode-";
export const guessesDayStoragePrefix = "guesses-";

const eventKey = (practice 
  ? (nightmare ? "Nightmare " : instant ? "Instant " :  "Unlimited " ) 
  : "Day "
) + currentSeed.toString();

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

function useLocalStorageWriteImmediately<T>(
  key: string,
  initial: T
): [T, (value: T | ((t: T) => T)) => void] {
  const [current, setCurrent] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        window.localStorage.setItem(key, JSON.stringify(initial));
      }
      return item ? JSON.parse(item) : initial;
    } catch (e) {
      window.localStorage.setItem(key, JSON.stringify(initial));
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
  hardMode: boolean;
}

const eligible = targetList.slice(0, targetList.indexOf("murky") + 1).filter((word) => word.length === 5); // Words no rarer than this one
const fivesDictionary = dictionary.filter((word) => word.length === 5); 

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
    if (word2.lastIndexOf(word1[i]) !== -1) {
      return false;
    }
  }
  return true;
}

function wordsHaveNoOverlap(word1: string, word2: string) {
  for (let i = 0; i < word1.length; ++i) {
    if(word1[i] === word2[i]) {
      return false;
    }
    if (word2.lastIndexOf(word1[i]) !== -1) {
      return false;
    }
  }
  return true;
}

function countMatching(cluedLetters: CluedLetter[]) : Map<Clue, number> {
  let counts = new Map<Clue,number>();
  for (const letter of cluedLetters) {
    let clue = letter.clue;
    if (clue) {
      let count = counts.get(clue) ?? 0;
      counts.set(clue, count+1);
    }
  }
  return counts;
}

function isGoodInitialGuess(targets: [string,string], candidate: string) {
  if (/\*/.test(candidate)) {
    return false;
  }
  let hints1 = clue(candidate, targets[0]);
  let hints2 = clue(candidate, targets[1]);
  let green1 = countMatching(hints1).get(Clue.Correct) ?? 0;
  let yellow1 = countMatching(hints1).get(Clue.Elsewhere) ?? 0;
  let green2 = countMatching(hints2).get(Clue.Correct) ?? 0;
  let yellow2 = countMatching(hints2).get(Clue.Elsewhere) ?? 0;  
  return green1+yellow1 < 5 && green2+yellow2 < 5;
}

function randomTargets(random: ()=>number): [string,string] {
  let candidate1: string;
  let candidate2: string;
  do {
    candidate1 = pick(eligible, random);
    candidate2 = pick(eligible, random);
  } while (!isValidCluePair(candidate1,candidate2));
  return [candidate1, candidate2];
}

function initialGuess(targets: [string,string], random: ()=>number): [string] {
  let candidate: string;
  do {
    candidate = pick(eligible, random);
  } while(!isGoodInitialGuess(targets, candidate));
  return [candidate];
}

function randomClue(targets: string[], random: ()=>number) {
  let candidate: string;
  do {
    candidate = pick(eligible, random);
  } while (targets.includes(candidate));
  return candidate;
}

function gameOverText(state: GameState, initialGuesses: string[], targets: [string,string]) : string {
  const verbed = state === GameState.Won ? "won!" : "lost.";
  const playagain = practice ? " Go again!" : " Play again tomorrow!";
  return `You ${verbed}${playagain}`; 
}

export async function copyImportCode() {
  try {
    await navigator.clipboard.writeText(serializeStorage());
    return;
  } catch (e) {
    console.warn("navigator.clipboard.writeText failed:", e);
  }
}

let uniqueGame = practice ? 100000 : 1000;
export function makePuzzle(seed: number) : Puzzle { 
  let hardCoded = hardCodedPuzzles[seed];
  if (hardCoded && !practice) {
    if (wordsHaveNoOverlap(hardCoded.targets[0], hardCoded.targets[1]) ) {
      hardCoded.imageCredit = hardCoded.imageCredit == "" ? "midjourney ai with prompts by keldor" : hardCoded.imageCredit;
      return hardCoded;
    }
    else {
      window.console.log("ERROR: " + hardCoded.targets.join(","));
    }
  }
  hardCoded = hardCodedPractice[seed];
  if (hardCoded && practice) {
    if (wordsHaveNoOverlap(hardCoded.targets[0], hardCoded.targets[1]) ) {
      return hardCoded;
    }
    else {
      window.console.log("ERROR: " + hardCoded.targets.join(","));
    }
  }
  let random = makeRandom(seed+uniqueGame);
  let targets =  randomTargets(random);
  let puzzle: Puzzle = {
    targets: targets,
    initialGuesses: initialGuess(targets, random),
    puzzleCredit: "",
    imageCredit: ""
  };
  return puzzle;
}

export function imageUrls(puzzleNumber: number) : [string,string] {
  let day = GetDaySpoilers(puzzleNumber);
  let preview = "/images/" + puzzleNumber.toString() + "-" + day?.puzzle.initialGuesses[0] + "-sm.jpg";
  let original = "/images/" + puzzleNumber.toString() + "-" + day?.puzzle.initialGuesses[0] + ".png";
  return [preview, original];
}

export function allGreenCount(puzzle: Puzzle) : number {
  let allGreens = 0;
  for(const word of eligible) {
    let matching = countMatching(xorclue(clue(word, puzzle.targets[0]), clue(word,puzzle.targets[1])));    
    if(matching.get(Clue.Correct) == 5) {
      ++allGreens;
    }
  }
  return allGreens;
}

export function cluesEqual(clue1: CluedLetter[], clue2: CluedLetter[]) {
  if (clue1.length != clue2.length ) {
    return false;
  }
  for(var i = 0; i < clue1.length; ++i ) {
    if(clue1[i].clue != clue2[i].clue ) {
      return false;
    }
  }
  return true;
}

export function clueCompatible(word: string, cluedPair: CluedLetter[]) {
  if (word.length != cluedPair.length ) {
    return false;
  }
  for(var i = 0; i < word.length; ++i ) {
    if (word.lastIndexOf(cluedPair[i].letter) == -1 ) 
      continue;
    if(cluedPair[i].clue === Clue.Correct && word[i] !== cluedPair[i].letter)
      return false;
    if(cluedPair[i].clue === Clue.Elsewhere && word[i] === cluedPair[i].letter)
      return false;
  }
  return true;
}

export function checkAnagrams(solutions1: [string, string], solutions2: [string,string]) {
  var first = solutions1[0].split('').concat(solutions1[1].split('')).sort().join('');
  var second = solutions2[0].split('').concat(solutions2[1].split('')).sort().join('');
  return first.localeCompare(second) == 0;
}

export function countSolutions(puzzle: Puzzle, guesses: string[], dictionaryToUse: string[], stopat: number) : number {
 
  let gotClues : CluedLetter[][] = [];
  for(var i = 0; i < guesses.length; ++i) {
    const guess = guesses[i];
    gotClues[i] = xorclue(clue(guess,puzzle.targets[0]),clue(guess,puzzle.targets[1]));
  }

  dictionaryToUse = dictionaryToUse.filter((word) => {
    for(var i = 0; i < guesses.length; ++i) {
      const guess = guesses[i];  
      if (!clueCompatible(word, gotClues[i])) {
        return false;
      }
    }
    return true;
  });

  let solutions = 0;
  for(const word1 of dictionaryToUse) {
    for (const word2 of dictionaryToUse) {
      if (word2.localeCompare(word1) <= 0) 
        continue;
      let contradicted = false;
      for(var i = 0; i < guesses.length; ++i) {
        const guess = guesses[i];
        let gotClue = gotClues[i];        
        let wouldClue = xorclue(clue(guess,word1),clue(guess,word2));
        if (!cluesEqual(wouldClue,gotClue)) {
          contradicted = true;
          break;
        }
      }
      if (!contradicted) {
        ++solutions;
        window.console.log(word1+", "+word2);
        if (solutions >= stopat) {
          return stopat;
        }
      }
    }
  }
  return solutions;
}

export function emojiBlock(day: Day, colorBlind: boolean) : string {
  const emoji = colorBlind
    ? ["⬛", "🟦", "🟧"]
    : ["⬛", "🟨", "🟩"];
  return day.guesses.map((guess) =>
        xorclue(clue(guess, day.puzzle.targets[0]),clue(guess, day.puzzle.targets[1]))
          .map((c) => emoji[c.clue ?? 0])
          .join("")
      )
      .join("\n");
}

export interface Puzzle {
  targets: [string, string],
  initialGuesses: string[],
  puzzleCredit: string,
  imageCredit: string
}

function Game(props: GameProps) {

  if (isDev && urlParam("fillFakeData")) {
    for(let i = 1; i <= parseInt(urlParam("fillFakeData") ?? "1"); ++i) {
      window.console.log("faking day " + i);
      let fakeStateStorageKey = gameDayStoragePrefix+i;
      let random = makeRandom(i);
      let fakeResult : GameState = pick([GameState.Won, GameState.Lost], random);
      localStorage.setItem(fakeStateStorageKey, JSON.stringify(fakeResult));
      let fakeGuessesStorageKey = guessesDayStoragePrefix+i;
      let fakeGuesses : string[] = [
        randomClue([], random),
        randomClue([], random),
        randomClue([], random),
        randomClue([], random),
        randomClue([], random),
        randomClue([], random),
        randomClue([], random),
        randomClue([], random),
        randomClue([], random),
      ];
      localStorage.setItem(fakeGuessesStorageKey, JSON.stringify(fakeGuesses));
    }
  }

  let researchDivs : JSX.Element[] = [];
  if (research !== null) {
    const targets = research.split(",");
    if ( targets.length == 1 || targets.length == 2) {
      let clues : string[][] = [];
      for(const word of eligible) {
        if (/\*/.test(word)) {
          continue;
        }
        let theClue = clue(word, targets[0]);
        if ( targets.length == 2 ) {
          theClue = xorclue(clue(word,targets[1]), theClue);
        }
        const matching = countMatching(theClue);
        const sortscore = (matching.get(Clue.Elsewhere) ?? 0 ) + (matching.get(Clue.Correct) ?? 0) * 6;
        const theText = word + ":" + (theClue.map((c) => ["⬛", "🟨", "🟩"][c.clue ?? 0]).join(""));
        clues[sortscore] = clues[sortscore] ? [...clues[sortscore], theText] : [theText];
      }
      for(let scorewords of clues) {
        if (scorewords) {
          for(let word of scorewords) {
            researchDivs = [...researchDivs, (<p>{word}</p>)];
          }
        }
      }      
      for(const researchWord of targets) {
        let str = researchWord + ": " + (eligible.lastIndexOf(researchWord) === -1 ? "not an answer word, " : "an answer word, ");
        str = str + (fivesDictionary.lastIndexOf(researchWord) === -1 ? "not in dictionary" : "in dictionary");
        researchDivs = [...researchDivs, (<p>{str}</p>)];
      }
      if (targets.length == 2) {
        let str = isValidCluePair(targets[0], targets[1]) ? "valid clue pair\n": "not valid clue pair\n";
        researchDivs = [...researchDivs, (<p>{str}</p>)];
      }      
    }
  }
   
  if (isDev && urlParam("export")) {
    let previous : Record<string, number[]> = {};
    let values : Record<number, Puzzle> = {};    
    for(let i = 1; i <= parseInt(urlParam("export") ?? "1"); ++i) {
      if (practice && -1 == nightmares.lastIndexOf(i) && -1 == instants.lastIndexOf(i))
        continue;
      values[i] = makePuzzle(i);
      for(let target of values[i].targets) {
        if (previous[target] === undefined)
        {
          previous[target] = [i];
        }
        else
        {
          previous[target] = [...previous[target], i];
        }
      }
    }
    window.console.log( JSON.stringify(values, null, "\t") );
    window.console.log( "Total Words: " + Object.keys(previous).length);
    for(const target in previous) {
      if (previous[target].length > 1) {
        window.console.log(target + " duplicated on days " +previous[target].join(","));
      }
    }
  }

  if (isDev && urlParam("findgreen")) {
    let largest: Puzzle;
    let largestCount = -1;
    for(let i = 1; i <= parseInt(urlParam("findgreen") ?? "1"); ++i) {
      let candidate: Puzzle = makePuzzle(i);
      let candidateCount = allGreenCount(candidate);
      if (candidateCount >= largestCount) {
        largest = candidate;
        largestCount = candidateCount;
        window.console.log( "\npuzzle #" + i + " has " + largestCount + " monogreens:" + JSON.stringify(largest, null, "\t") );
      }
    }
  }

  const resetDay = () => {
    if (isDev) {
      window.localStorage.removeItem(gameDayStoragePrefix+dayNum);
      window.localStorage.removeItem(hardModeStoragePrefix+dayNum);
      window.localStorage.removeItem(guessesDayStoragePrefix+dayNum);
    }
  }

  const resetPractice = () => {
    window.localStorage.removeItem("practice");
    window.localStorage.removeItem("practiceState");
    window.localStorage.removeItem("practiceHardMode");
    window.localStorage.removeItem("practiceGuesses");
  }

  if (needResetPractice) {
    resetPractice();
  }

  const [puzzle, setPuzzle] = useState(() => {
    return makePuzzle(currentSeed);
  });

  let hardModeStorageKey = practice ? ("practiceHardMode"+((nightmare||instant)?currentSeed.toString():"")) : (hardModeStoragePrefix+currentSeed);
  let stateStorageKey = practice ? ("practiceState"+((nightmare||instant)?currentSeed.toString():"")) : (gameDayStoragePrefix+currentSeed);
  let guessesStorageKey = practice ? ("practiceGuesses"+((nightmare||instant)?currentSeed.toString():"")) : (guessesDayStoragePrefix+currentSeed);

  const [gameState, setGameState] = useLocalStorage<GameState>(stateStorageKey, GameState.Playing);
  const [hardModeState, setHardModeState] = useLocalStorageWriteImmediately<boolean>(hardModeStorageKey, props.hardMode);
  const [guesses, setGuesses] = useLocalStorage<string[]>(guessesStorageKey, new Array(puzzle.initialGuesses.length));
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [hint, setHint] = useState<string>(getHintFromState());
  const [haveImage, setHaveImage] = useState<boolean>(isDev);

  let Goat = (str: string) => {
    GoatEvent(str + (hardModeState ? ", Hard" : ""));
  };  

  let guessesChanged = false;
  let newGuesses = [...guesses];
  for(let i = 0; i < puzzle.initialGuesses.length; ++i) {
    let knownGuess = (hardModeState && gameState === GameState.Playing) ? puzzle.initialGuesses[i].slice(0, guesses.length-puzzle.initialGuesses.length) : puzzle.initialGuesses[i];
    if ( newGuesses[i] != knownGuess) {
      newGuesses[i] = knownGuess;
      guessesChanged = true;
    }
  }

  if (guessesChanged) {
    setGuesses(newGuesses);
  }
   
  const tableRef = useRef<HTMLTableElement>(null);
  async function share(copiedHint: string, text?: string) {
    const url = window.location.origin + window.location.pathname + (practice ? ("?unlimited=" + currentSeed.toString()) : "");
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

  function checkImage(puzzleNumber: number, puzzleStart: string) {
    if (practice) {
      return;
    }
    var request = new XMLHttpRequest();
    request.open("GET", "/images/" + puzzleNumber.toString() + "-" + puzzleStart + "-sm.jpg", true);
    request.send();
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        let contentType = request.getResponseHeader("content-type");
        if ( contentType == "image/jpeg" ) {
          setHaveImage(true);
        }
      }
    };
  }

  function getHintFromState() {    
    if  (gameState === GameState.Won || gameState === GameState.Lost) {
      return gameOverText(gameState, puzzle.initialGuesses, puzzle.targets);
    }
    if (guesses.includes(puzzle.targets[0])) {
      return `You got ${puzzle.targets[0].toUpperCase()}, one more to go.`;
    }     
    if (guesses.includes(puzzle.targets[1])) {
      return `You got ${puzzle.targets[1].toUpperCase()}, one more to go.`;
    }
    let text = `Two words remain.`;
    if (nightmare) {
      text = `You found hidden nightmare puzzle #${nightmares.indexOf(currentSeed)+1} of ${nightmares.length}.`;
    }
    if (instant) {
      text = `You found an instant puzzle #${instants.indexOf(currentSeed)+1} of ${instants.length}! There's only one possible solution from here.`
    }
    return text;
  }

  const onKey = (key: string) => {
    if (gameState !== GameState.Playing) {
      return;
    }

    const bonusGuess = guesses.length === maxGuesses && puzzle.targets.includes(guesses[guesses.length-1]);
    const realMaxGuesses = props.maxGuesses+(bonusGuess?1:0);
  
    if (guesses.length === realMaxGuesses) {
      return;
    }
    if (/^[a-z]$/i.test(key)) {
      setCurrentGuess((guess) =>
        (guess + key.toLowerCase()).slice(0, 5)
      );
      tableRef.current?.focus();
      setHint(getHintFromState());
    } else if (key === "Backspace") {
      setCurrentGuess((guess) => guess.slice(0, -1));
      setHint(getHintFromState());
    } else if (key === "Enter") {
    
      if (currentGuess.length !== 5) {
        setHint("Type more letters");
        return;
      }
      if(guesses.includes(currentGuess)) {
        setHint("You've already guessed that");
        return;
      }
      if (!fivesDictionary.includes(currentGuess)) {
        Goat("Nonword: " + currentGuess);
        setHint(`That's not in the word list`);
        return;
      }

      Goat("Guess " + (guesses.length+1) + ": " + currentGuess);
     
      setGuesses((guesses) => guesses.concat([currentGuess]));
      setCurrentGuess("");
      speak(describeClue(xorclue(clue(currentGuess, puzzle.targets[0]), clue(currentGuess, puzzle.targets[1]))))
      doWinOrLose();
    }
  };

  const doWinOrLose = () => {
    if ( puzzle.targets.length !== 2 ) {
      return;
    }
    if ( gameState == GameState.Playing ) {      
      if ( (guesses.includes(puzzle.targets[0]) && guesses.includes(puzzle.targets[1])) ) {
        setGameState(GameState.Won);
        Goat("Won: " + eventKey + ", " + guesses.length + " guesses");
      } else if (guesses.length >= props.maxGuesses) {
        if (puzzle.targets.includes(guesses[guesses.length-1])) {
          setHint("Last chance! Do a bonus guess.")
          return;
        }        
        setGameState(GameState.Lost);
        Goat("Lost: " + eventKey);
      } 
    } 
    setHint(getHintFromState());
  };

  const logSolutionCounts = () => {
    if (isDev) {
      let solutions = countSolutions(puzzle,guesses,eligible,10);
      window.console.log(solutions + (solutions >= 10 ? "+" : "") + " common solution" + (solutions == 1 ? "" : "s"));
      if (solutions <= 1 ) {         
        let max = 5;
        solutions = countSolutions(puzzle,guesses,fivesDictionary,max); 
        window.console.log(solutions + (solutions >= max ? "+" : "") + " total solution" + (solutions == 1 ? "" : "s"));
      }
    }
  };

  useEffect(() => {
    if(dayNum == 350 && puzzle.initialGuesses[0] == "knows") {
      puzzle.initialGuesses[0] = "oops!";
    }
  }, [currentGuess, gameState]);

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

  useEffect(()=> {
    checkImage(currentSeed, puzzle.initialGuesses[0]);
  });

  useEffect(() => {
    doWinOrLose();
  }, [currentGuess, gameState, guesses, puzzle.targets]);

  useEffect(() => {
    if ( gameState == GameState.Playing && guesses.length == puzzle.initialGuesses.length && currentGuess.length == 0 ) {
      Goat("Starting: " + eventKey);
    }
  }, [currentSeed]);

  let reduceCorrect = (prev: CluedLetter, iter: CluedLetter, currentIndex: number, array: CluedLetter[]) => {
    let reduced: CluedLetter = prev;
    if ( iter.clue !== Clue.Correct ) {
      reduced.clue = Clue.Absent;
    }
    return reduced;
  };

  const showBonusGuessRow =  
    (gameState === GameState.Playing && guesses.length === maxGuesses && puzzle.targets.includes(guesses[guesses.length-1])) ||
    (gameState !== GameState.Playing && guesses.length === (maxGuesses+1));

  const realMaxGuesses = Math.max(guesses.length,(showBonusGuessRow ? props.maxGuesses+1 : props.maxGuesses ));
  let letterInfo = new Map<string, Clue>();
  const correctGuess = 
    gameState === GameState.Won 
    ? "" 
    : guesses.includes(puzzle.targets[0]) 
    ? puzzle.targets[0]
    : guesses.includes(puzzle.targets[1])
    ? puzzle.targets[1]
    : "";

  const cluedRows = Array(realMaxGuesses)
    .fill(undefined)
    .map((_,i)=>{
      const guess = [...guesses, currentGuess][i] ?? "";
      return xorclue(clue(guess, puzzle.targets[0]),clue(guess, puzzle.targets[1])); 
    });

  const tableRows = Array(realMaxGuesses)
    .fill(undefined)
    .map((_, i) => {      
      const guess = [...guesses, currentGuess][i] ?? "";
      const cluedLetters = cluedRows[i];
      const isTarget = puzzle.targets.includes(guess);
      const isBonusGuess = i === maxGuesses;
      const lockedIn = (!isBonusGuess && i < guesses.length) || (isBonusGuess && guesses.length === realMaxGuesses);
      const isAllGreen = lockedIn && cluedLetters.reduce( reduceCorrect, {clue: Clue.Correct, letter: ""} ).clue === Clue.Correct;                
      const isPartial = guess.length < 5;
      const isInitialGuess = i < puzzle.initialGuesses.length;
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
          rowState={
            lockedIn
              ? RowState.LockedIn
              : (i === guesses.length || isBonusGuess)
              ? RowState.Editing
              : RowState.Pending
          }
          cluedRows={cluedRows.slice(undefined, guesses.length)}
          cluedLetters={cluedLetters}
          letterInfo={letterInfo}
          correctGuess={correctGuess}
          numInitialGuesses={puzzle.initialGuesses.length}
          rowNumber={i}
          annotation={isBonusGuess ? "Bonus!" : (isPartial && isInitialGuess && hardModeState) ? "!!!": ((isAllGreen && !isTarget) ? "Huh?" : undefined)}          
        />
      );
    });
    
  if (puzzle.initialGuesses.length > 0) {
    const cells: Element[] = Array(5).fill((<td className="Row-separator Row-letter"><span></span></td>));
    tableRows.splice(puzzle.initialGuesses.length, 0, (<tr className="Row Row-locked-in">{cells}</tr>))
  }

  const dateText = `, ${new Date(day1Date.getTime()+(dayNum)*86400*1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  const cheatText = cheat ? ` ${puzzle.targets}` : "";
  const canPrev = dayNum > 1;
  const canNext = dayNum < todayDayNum || isDev;
  const practiceLink = "?unlimited";
  const practiceLinkHard = "?unlimited&hard";
  const prevLink = "?x=" + (dayNum-1).toString() + (isDev ? "&xyzzyx="+cheatyface["password"] : "") + (cheat ? "&cheat=1" : "") + (urlParam("preventRedirect") !== null ? "&preventRedirect" : "");
  const nextLink = "?x=" + (dayNum+1).toString() + (isDev ? "&xyzzyx="+cheatyface["password"] : "") + (cheat ? "&cheat=1" : "") + (urlParam("preventRedirect") !== null ? "&preventRedirect" : "");

  const newsIndex = 9;
  const [readNewsItem, setReadNewsItem] = useLocalStorageWriteImmediately<number>("read-news-item", 0);
  const news: string = "There's now an experimental 'hard mode' available in game settings that makes it so the starting clue is only revealed one letter at a time as you guess. Emoji-results and game history will be marked with !!! to indicate the puzzle was played in hard mode. Changing the setting will take effect on the *next* puzzle you start.";
  const showNews = readNewsItem < newsIndex && RawStats().wins >= 1 && gameState == GameState.Playing;
  const hardModeIndicator = hardModeState ? " !!!" : "";
  const imageCredit = puzzle.imageCredit !== "" ? ("Image by " + puzzle.imageCredit + ".") : "";
  
  return (
    <div className="Game" style={{ display: props.hidden ? "none" : "block" }}>
      {showNews && (<PopUp text={news} title={"News!"} onClick={ ()=>{setReadNewsItem(newsIndex); } }/>) }
      <div className="Game-options">
        {!practice && canPrev && <span><a className="NextPrev" href={prevLink}>«</a> </span>}
        {!practice && !canPrev && <span> <a className="NextPrev">&nbsp;</a></span>}
        {!practice && <span className="DayNum">Day {dayNum}{`${cheatText}`}{`${dateText}`}</span>}
        {!practice && canNext && <span> <a className="NextPrev" href={nextLink}>»</a></span>}
        {!practice && !canNext && <span> <a className="NextPrev">&nbsp;</a></span>}
        {(isDev || dayNum == 350) && <span>| <a href={window.location.href} onClick={ ()=>{resetDay();} }>Reset</a></span>}
        {isDev && <span>| <a href={window.location.href} onClick={ (e)=>{logSolutionCounts(); e.preventDefault();} }>Count</a></span>}

        {practice && <span>{`${cheatText}`}</span>}
        {practice && <span>
          <a href=""
            className="practiceLink"
            onClick={(e) => {
              const score = gameState === GameState.Lost ? "X" : (guesses.length-puzzle.initialGuesses.length);
              share(
                "Challenge link copied to clipboard!",
                ``
              );
              e.preventDefault();
            }}
          >
            Share
          </a>
        
          <a href={practiceLink} className="practiceLink" onClick={ ()=>{resetPractice();} }> +New </a>

          <a href={practiceLinkHard} className="practiceLink" onClick={ ()=>{resetPractice();} }> +New (Hard Mode)</a></span>
        }
      </div>
      {readOnly() && (<div><p>The site has <b>permanently moved</b> to <a href='https://xordle.org'>https://xordle.org</a>. That's .org rather than .xyz. It's still up here temporarily and in a read-only state, you can't play here. <b>When you visit the new site</b>, you can click ❓, and there will be a link at the bottom to <b>import your game history from this site.</b></p></div>)}
      <table
        className="Game-rows"
        tabIndex={0}
        aria-label="table of guesses"
        ref={tableRef}
      >
        <tbody>{tableRows}</tbody>
      </table>
      <div
        role="alert"
        style={{
          userSelect: /https?:/.test(hint) ? "text" : "none",
          whiteSpace: "pre-wrap",
        }}
      >
        {!nightmare && (hint || `\u00a0`)}
        {nightmare && 
          <div className="stack stacks3 nightmare">
            <span className="index0">{hint}</span>
            <span className="index1">{hint}</span>
            <span className="index2">{hint}</span>
          </div>
        }
        {gameState !== GameState.Playing && (
          <p>
          <button
            onClick={() => {
              const score = gameState === GameState.Lost ? "X" : (guesses.length-puzzle.initialGuesses.length);
              share(
                "Result copied to clipboard!",
                `${gameName} ${practice ? ((nightmare ? "nightmare " : instant ? "instant " : "unlimited ") + currentSeed.toString()) : ("#"+dayNum.toString())}${hardModeIndicator} ${score}/${props.maxGuesses-1}\n` +
                emojiBlock({guesses:guesses, puzzle:puzzle, gameState:gameState, hardMode:hardModeState}, props.colorBlind)
              );
            }}
          >
            Share
          </button>
          </p>
        )}      
      </div>
      {gameState !== GameState.Playing && (<p>
        {puzzle.initialGuesses.map(s=>s.toUpperCase()).join(", ")} » {puzzle.targets[0].toUpperCase()} + {puzzle.targets[1].toUpperCase()}</p>)}

      {haveImage && gameState !== GameState.Playing &&
        (<a className="rewardImageLink" href={`/images/${currentSeed}-${puzzle.initialGuesses[0]}.png`} target="_blank">
          <img className="rewardImage" title={imageCredit} src={`/images/${currentSeed}-${puzzle.initialGuesses[0]}-sm.jpg`}/>
        </a>)
      }

      {haveImage && gameState !== GameState.Playing && puzzle.puzzleCredit !== "" && (<p>Puzzle submitted by {puzzle.puzzleCredit}.</p>)}

      {researchDivs}
      {readOnly() && (
        <p>
        <button onClick={() => {copyImportCode();}} >
          Copy import code
        </button>
        </p>
      )}
      {(gameState === GameState.Playing && !readOnly() ) && (
        <Keyboard
          layout={props.keyboardLayout}
          letterInfo={letterInfo}
          correctGuess={correctGuess}
          onKey={onKey}
        />)}
    </div>
  );
}

export default Game;
