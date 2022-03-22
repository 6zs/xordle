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
          <br />see also: <a href="https://fibble.xyz">fibble</a>
        </p>
      <p className="App-instructions">
        there are two secret words
        <br />they share no letters in common
        <br />you get {maxGuesses} tries to guess both words
        <br />
        <br />you start with a random clue
        <br />it's the same for everyone
        <br />
        <br />letters in your guess are:
        <br />🟩 green if green in either word (right letter, right spot)
        <br />🟨 yellow if yellow in either word (right letter, wrong spot) 
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
