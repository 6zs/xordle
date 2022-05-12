import { Clue } from "./clue";
import { Row, RowState } from "./Row";
import { gameName, maxGuesses } from "./util";

export function About() {
  return (
    <div className="App-about">
        <p>
          {gameName} is a variant of {" "}
          <a href="https://www.powerlanguage.co.uk/wordle/"> 
            Wordle
          </a> by Josh Wardle and is one of three sibling sites.{" "}
          <br /><br /> <a href="https://xordle.xyz">Xordle</a> by <a href="https://twitter.com/kellydornhaus">keldor</a><br/>Two secret words, one board, no overlap between the words. 
          <br /><br /> <a href="https://fibble.xyz">Fibble</a> by K &amp; R Garfield, coded by keldor <br/>Lies to you once per row.
          <br /><br /> <a href="https://warmle.org">Warmle</a> by Mike Elliott, coded by keldor <br/>Yellows tell you if you've gotten close in that position.
        </p>
      <hr />        
      <p className="App-instructions">
        <h1>Xordle rules</h1>
        There are two secret words.
        <br /><b>They share no letters in common.</b>
        <br />You get {maxGuesses} tries to guess both words.
        <br />
        <br />You start with a random clue.
        <br />It's the same for everyone.
        <br />
        <br />Letters in your guess are:
        <br />🟩 Green if green in either word (right letter, right spot).
        <br />🟨 Yellow if yellow in either word (right letter, wrong spot).
        <br />⬛ Grey if it does not appear in either word.
      </p>
      <hr />
      <p>
        Report issues{" "}
        <a href="https://github.com/6zs/xordle/issues">here</a>.
        <br />Code based on a fork of <a href="https://github.com/lynn/hello-wordl">hello wordl</a>.
      </p>
      <p>
      </p>
    </div>
  );
}
