import { Clue } from "./clue";
import { Row, RowState } from "./Row";
import { gameName, maxGuesses } from "./util";

export function About() {
  return (
    <div className="App-about">
        <p>
          {gameName} is a variant of {" "}
          <a href="https://www.powerlanguage.co.uk/wordle/">
            wordle
          </a>{" "}
          <br />code based on a fork of <a href="https://github.com/lynn/hello-wordl">hello wordl</a>
        </p>
      <p className="App-instructions">
        there are two secret words
        <br />they share no letters in common
        <br />you get {maxGuesses} tries to guess both words
        <br />
        <br />letters in your guess are:
        <br />🟩 green if it would be green in either secret word in wordle
        <br />🟨 yellow if it would be yellow in either 
        <br />⬛ grey if it does not appear in either word
      </p>
      <hr />
      <p>
        report issues{" "}
        <a href="https://github.com/6zs/xordle/issues">here</a>
      </p>
      <p>
      </p>
    </div>
  );
}
