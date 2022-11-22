import { deserializeStorage } from "./App";
import { copyImportCode } from "./Game";
import { gameName, maxGuesses } from "./util";

export async function pasteImportCode() {
  const enteredCode = prompt('Please paste your import code');
  if ( enteredCode !== null ) {
    deserializeStorage(enteredCode);
  }
}

export function About() {
  let importLink = (
  <div>
  <hr/>
  <p><h2>Transferring game history to a new device or browser</h2></p>
  <p>
    <p>Click <button onClick={() =>{copyImportCode();}}>here</button> to copy an import code to your clipboard which you can use to transfer your stats to another device.</p>
    <p>Click <button onClick={() =>{pasteImportCode();}}>here</button> to paste an import code from your clipboard.</p>
  </p>
  </div>
  );

  return (
    <div className="App-about">
        <p>
          {gameName} is a variant of {" "}
          <a href="https://www.powerlanguage.co.uk/wordle/"> 
            Wordle
          </a> by Josh Wardle and is one of three sibling sites.{" "}
          <br /><br /> <a href="https://xordle.org">Xordle</a> by <a href="https://twitter.com/kellydornhaus">keldor</a><br/>Two secret words, one board, no overlap between the words. 
          <br /><br /> <a href="https://fibble.xyz">Fibble</a> by K &amp; R Garfield, coded by keldor <br/>Lies to you once per row.
          <br /><br /> <a href="https://warmle.org">Warmle</a> by Mike Elliott, coded by keldor <br/>Yellows tell you if you've gotten close in that position.
          <br /><br />Code based on a fork of <a href="https://github.com/lynn/hello-wordl">hello wordl</a>.
        </p>
      <hr />        
      <p className="App-instructions">
        <h1>Xordle Rules!</h1>
        There are two secret words.
        <br /><b>They share no letters in common.</b>
        <br />You get {maxGuesses-1} tries to guess both words.
        <br />
        <br />You start with a clue already given. It's the same for everyone. 
        <br />The daily puzzle is often themed, but not always, and the theme is often not obvious.
        <br />
        <br />Letters in your guess are:
        <br />🟩 Green if green in either word (right letter, right spot).
        <br />🟨 Yellow if yellow in either word (right letter, wrong spot).
        <br />⬛ Grey if it does not appear in either word.
        <br />
      </p>
      <hr />      
      <h1>Daily puzzle images</h1>
      The images are generated using the Midjourney AI with prompts authored by keldor.
      <hr />
      <p>
        <h1>User submissions and contact info</h1>
        Feel free to send in puzzle suggestions using <a href="https://forms.gle/CMc6BAzwjzMWqgS17">this form</a>.  
        You can report game issues{" "}
        <a href="https://github.com/6zs/xordle/issues">here</a> or send me an <a href="mailto:kellydornhaus@gmail.com">email</a> about whatever is on your mind.<br/>        
        <br />Keldor blog exists at <a href="https://keldor.org">keldor.org</a> and includes image galleries of past puzzles.        
      </p>
      {importLink}
      <p>
      </p>
    </div>
  );
}
