import { Clue } from "./clue";
import { Row, RowState } from "./Row";
import { gameName, maxGuesses } from "./util";

export function About() {
  return (
    <div className="App-about">
      <p>
        <i>{gameName}</i> is a variant of the word game{" "}
        <a href="https://www.powerlanguage.co.uk/wordle/">
          <i>Wordle</i>
        </a>{" "}
        by <a href="https://twitter.com/powerlanguish">powerlanguage</a>, 
        based on <a href="https://github.com/lynn/hello-wordl">hello wordl</a>
      </p>
      <p>
        You get {maxGuesses} tries to guess a target word.
        <br />
        There are TWO target words. They share no letters in common. Letters in your guess are green if they would be green in either of the secret words in Wordle. Otherwise, they're yellow if they'd be yellow in either.
      </p>
      <hr />
      <p>
        Report issues{" "}
        <a href="https://github.com/6vz/xordle/issues">here</a>.
      </p>
      <p>
        This game will be free and ad-free forever,
        <br />
        but you can <a href="https://ko-fi.com/chordbug">buy chordbug a coffee</a> if
        you'd like.
      </p>
    </div>
  );
}
