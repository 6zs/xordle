import "./App.css";
import { day1Date, todayDate, maxGuesses, dateToNumber, day1Number, todayDayNum, dayNum, allowPractice, practice, urlParam } from "./util";
import Game, { emojiBlock, GameState } from "./Game";
import { useEffect, useState } from "react";
import { About } from "./About";
import { GetDay, Stats } from "./Stats";
import Calendar from "react-calendar";

function serializeStorage() : string {
  return window.btoa(window.JSON.stringify(window.localStorage));
}

function deserializeStorage(serialized: string) {
  try {
    let o = window.JSON.parse(window.atob(serialized));
    for (let [key, value] of Object.entries(o)) {
      window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    }
  } catch(e) {
    console.log(e);
  }
}

const redirectFrom = "6zs.github.io";
const redirectTo = "https://xordle.xyz/";
const save = new URLSearchParams(window.location.search).get("save") ?? "";

function useSetting<T>(
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

function App() {
  type Page = "game" | "about" | "settings" | "stats" | "calendar";
  const [page, setPage] = useState<Page>("game");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [dark, setDark] = useSetting<boolean>("dark", prefersDark);
  const [colorBlind, setColorBlind] = useSetting<boolean>("colorblind", false);
  const [keyboard, setKeyboard] = useSetting<string>(
    "keyboard",
    "qwertyuiop-asdfghjkl-BzxcvbnmE"
  );
  const [enterLeft, setEnterLeft] = useSetting<boolean>("enter-left", false);

  useEffect(() => { 
    if (Number(dayNum) > Number(todayDayNum) && urlParam("xyzzyx") === null) {
      window.location.replace(redirectTo);
      return;
    }    
    if (save !== "") {
      deserializeStorage(save);
      window.location.replace(window.location.origin);
      return;
    }
    if (window.location.host.lastIndexOf(redirectFrom) === 0) {
      window.location.replace(redirectTo + "?save=" + serializeStorage());
      return;
    }
  });

  useEffect(() => {
    document.body.className = dark ? "dark" : "";
    setTimeout(() => {
      // Avoid transition on page load
      document.body.style.transition = "0.3s background-color ease-out";
    }, 1);
  }, [dark]);

  const link = (emoji: string, label: string, page: Page) => (
    <button
      className="emoji-link"
      onClick={() => setPage(page)}
      title={label}
      aria-label={label}
    >
      {emoji}
    </button>
  );

  function calendarTileContent(activeStartDate: any, date: Date, view: any) {
    let day = GetDay(date);
    return ( day && <pre>{emojiBlock(day, colorBlind)}</pre> );
  }

  function calendarFormatDay(locale: string, date: Date) {
    let day = GetDay(date);
    let result = "";
    if ( day ) {
      result = day.gameState === GameState.Playing
      ? "🎲"
      : day.gameState === GameState.Won
      ? "✔️"
      : "💀";
    }
    return date.toLocaleDateString(locale, { day: "numeric" }) + result;
  }

  const dailyLink = "/";
  const practiceLink = "/?unlimited";

  if (Number(dayNum) > Number(todayDayNum) && urlParam("xyzzyx") === null) {
    return (
      <div className={"App-container" + (colorBlind ? " color-blind" : "")}>
      <h1>
        <div className="Game-name-mode-container">
          <span className="Game-name">Xordle</span>             
        </div>
        <div className="Game-modes">
          Rewinding Time...
        </div>
      </h1>
      </div>
    )
  }

  return (
    <div className={"App-container" + (colorBlind ? " color-blind" : "")}>
      <h1>
        <div className="Game-name-mode-container">
        <span className="Game-name">Xordle</span>             
        <div className="Game-modes">
        {allowPractice && !practice && <a className="ModeEnabled">Daily</a>}
        {allowPractice && practice && <a className="ModeDisabled" href={dailyLink}>Daily</a>}
        {allowPractice && practice && <a className="ModeEnabled">Unlimited</a>}
        {allowPractice && !practice && <a className="ModeDisabled" href={practiceLink}>Unlimited</a>}
        </div>
        </div>
      </h1>
      <div className="top-right">
        {page !== "game" ? (
          link("❌", "Close", "game")
        ) : (
          <>
            {link("❓", "About", "about")}          
            {link("⚙️", "Settings", "settings")}            
            {link("📊", "Stats", "stats")}
            {link("📅", "Calendar", "calendar")}
          </>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 5,
          top: 5,
          visibility: page === "game" ? "visible" : "hidden",
        }}
      >
      </div>
      {page === "about" && <About />}
      {page === "stats" && <Stats />}
      {page === "calendar" && <Calendar 
        maxDate={todayDate}
        minDate={day1Date}
        minDetail={"month"}
        maxDetail={"month"}
        onClickDay={(value: Date, event: any) => {
          if ( value >= day1Date && value <= todayDate  ) {
            window.location.replace(window.location.origin + "?x="+(1 + dateToNumber(value) - day1Number));
          }
        }}
        formatDay={(locale: string, date: Date) => calendarFormatDay(locale, date)}
        tileContent={({ activeStartDate, date, view }) => calendarTileContent(activeStartDate, date, view) }
      />}
      {page === "settings" && (
        <div className="Settings">
          <div className="Settings-setting">
            <input
              id="dark-setting"
              type="checkbox"
              checked={dark}
              onChange={() => setDark((x: boolean) => !x)}
            />
            <label htmlFor="dark-setting">dark theme</label>
          </div>
          <div className="Settings-setting">
            <input
              id="colorblind-setting"
              type="checkbox"
              checked={colorBlind}
              onChange={() => setColorBlind((x: boolean) => !x)}
            />
            <label htmlFor="colorblind-setting">high-contrast colors</label>
          </div>
          <div className="Settings-setting">
            <label htmlFor="keyboard-setting">keyboard layout:</label>
            <select
              name="keyboard-setting"
              id="keyboard-setting"
              value={keyboard}
              onChange={(e) => setKeyboard(e.target.value)}
            >
              <option value="qwertyuiop-asdfghjkl-BzxcvbnmE">QWERTY</option>
              <option value="azertyuiop-qsdfghjklm-BwxcvbnE">AZERTY</option>
              <option value="qwertzuiop-asdfghjkl-ByxcvbnmE">QWERTZ</option>
              <option value="BpyfgcrlE-aoeuidhtns-qjkxbmwvz">Dvorak</option>
              <option value="qwfpgjluy-arstdhneio-BzxcvbkmE">Colemak</option>
            </select>
            <input
              style={{ marginLeft: 20 }}
              id="enter-left-setting"
              type="checkbox"
              checked={enterLeft}
              onChange={() => setEnterLeft((x: boolean) => !x)}
            />
            <label htmlFor="enter-left-setting">"Enter" on left side</label>
          </div>
        </div>
      )}
      <Game
        maxGuesses={maxGuesses}
        hidden={page !== "game"}
        colorBlind={colorBlind}
        keyboardLayout={keyboard.replaceAll(
          /[BE]/g,
          (x) => (enterLeft ? "EB" : "BE")["BE".indexOf(x)]
        )}
      />
    </div>
  );
}

export default App;
