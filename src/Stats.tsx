import { maxGuesses, day1Number, dateToNumber, todayDayNum, day1Date } from "./util";
import { Puzzle, GameState, gameDayStoragePrefix, guessesDayStoragePrefix, makePuzzle } from "./Game"

export interface Day
{
  puzzle: Puzzle,
  gameState: GameState,
  guesses: string[],
}

export function GetDay(date: Date) : Day | null
{
  return Day(1 + dateToNumber(date) - day1Number);
}

function Day(day: number) : Day | null 
{
  try {
    const resultKey = gameDayStoragePrefix+day;
    const guessesKey = guessesDayStoragePrefix+day;
    const storedState = window.localStorage.getItem(resultKey);
    const storedGuesses = window.localStorage.getItem(guessesKey)
    let state = GameState.Playing;
    if (storedState) {
      state = JSON.parse(storedState);
    }
    if ( storedGuesses ) {
      return { guesses: JSON.parse(storedGuesses), puzzle: makePuzzle(day), gameState: state };
    }
  } catch(e) {
  }
  return null;
}

export function Stats() {

  let histogram: Record<number,number> = {};
  let streak: number = 0;
  let maxStreak: number = 0;
  let games: number = 0;
  let wins: number = 0;
  let maxHistogram : number = 0;

  for (let i = 2; i <= maxGuesses+1; ++i) {
    histogram[i] = 0;
  }

  const OLD_gameDayStoragePrefix = "game-day-";
  const OLD_guessesDayStoragePrefix = "guesses-day-";
  for (let OLD_day: number = 0; OLD_day < 1000; ++OLD_day) {
    try {
      const resultKey = OLD_gameDayStoragePrefix+OLD_day;
      const guessesKey = OLD_guessesDayStoragePrefix+OLD_day;
      const storedState = window.localStorage.getItem(resultKey);
      const storedGuesses = window.localStorage.getItem(guessesKey)
      let state = GameState.Playing;
      let guesses = [];
      
      if (storedState) {
        state = JSON.parse(storedState);
        games++;
      }

      if (storedGuesses) {
        guesses = JSON.parse(storedGuesses);
      }
      
      if (state === GameState.Lost) {
        streak = 0;
      }
  
      if (state === GameState.Won) {
        histogram[guesses.length]++;
        if (histogram[guesses.length] > maxHistogram) {
          maxHistogram = histogram[guesses.length];
        }
        streak++;
        wins++;
        if (streak > maxStreak) {
          maxStreak = streak;
        }
      }  
    } catch(e) {
    }   
  }

  for (let day: number = 1; day <= todayDayNum; ++day) 
  {
    let results = Day(day);
    
    if (!results) {
      streak = 0;
      continue;
    }

    games++;

    if (results.gameState === GameState.Lost) {
      streak = 0;
    }

    if (results.gameState === GameState.Won) {
      histogram[results.guesses.length]++;
      if (histogram[results.guesses.length] > maxHistogram) {
        maxHistogram = histogram[results.guesses.length];
      }
      streak++;
      wins++;
      if (streak > maxStreak) {
        maxStreak = streak;
      }
    }
  }

  let styles : Record<number,Object> = {};  
  for (let key in histogram) {
   styles[key] = { 'width' : Math.max( 7, Math.floor(100 * histogram[key] / maxHistogram) ) + '%', 'align' : 'right' };
  }

  return (
    <div className="Game-stats">
    <h1>games</h1>
    <div className="Game-stats-games">
      <div className="stat">
        <div className="stat-num">{games}</div>
        <div className="stat-label">played</div>
      </div>
      <div className="stat">
        <div className="stat-num">{games === 0 ? 0 : Math.floor(100*wins/games)}</div>
        <div className="stat-label">win %</div>
      </div>
      <div className="stat">
        <div className="stat-num">{streak}</div>
        <div className="stat-label">streak</div>
      </div>
      <div className="stat">
        <div className="stat-num">{maxStreak}</div>
        <div className="stat-label">max streak</div>
      </div>
    </div>
    <h1>guesses</h1>
    <div className="Game-stats-guesses">
      <div className="guess-stat"><div className="guess-count">3</div><div className="guess-graph"><div className="guess-bar" style={styles[3]}><div className="guess-games">{histogram[3]}</div></div></div></div>
      <div className="guess-stat"><div className="guess-count">4</div><div className="guess-graph"><div className="guess-bar" style={styles[4]}><div className="guess-games">{histogram[4]}</div></div></div></div>
      <div className="guess-stat"><div className="guess-count">5</div><div className="guess-graph"><div className="guess-bar" style={styles[5]}><div className="guess-games">{histogram[5]}</div></div></div></div>
      <div className="guess-stat"><div className="guess-count">6</div><div className="guess-graph"><div className="guess-bar" style={styles[6]}><div className="guess-games">{histogram[6]}</div></div></div></div>
      <div className="guess-stat"><div className="guess-count">7</div><div className="guess-graph"><div className="guess-bar" style={styles[7]}><div className="guess-games">{histogram[7]}</div></div></div></div>
      <div className="guess-stat"><div className="guess-count">8</div><div className="guess-graph"><div className="guess-bar" style={styles[8]}><div className="guess-games">{histogram[8]}</div></div></div></div>
      <div className="guess-stat"><div className="guess-count">9</div><div className="guess-graph"><div className="guess-bar" style={styles[9]}><div className="guess-games">{histogram[9]}</div></div></div></div>
      {histogram[maxGuesses+1] > 0 && <div className="guess-stat"><div className="guess-count">10</div><div className="guess-graph"><div className="guess-bar" style={styles[10]}><div className="guess-games">{histogram[10]}</div></div></div></div>}
    </div>
  </div>
  );
}
