import { Clue, clueClass, CluedLetter, clueWord } from "./clue";
import { nightmare } from "./util";

export enum RowState {
  LockedIn,
  Editing,
  Pending,
}

interface RowProps {
  rowState: RowState;
  cluedLetters: CluedLetter[];
  letterInfo: Map<string, Clue>;
  correctGuess: string;
  annotation?: string;
  rowNumber: number;
  numInitialGuesses: number;
  cluedRows: CluedLetter[][];
}

function glitch(content: any) {
  return (
  <span className="stack stacks3">            
    <span className="index0">{content}</span>
    <span className="index1">{content}</span>
    <span className="index2">{content}</span>
  </span>
  )
}

export function Row(props: RowProps) {
  const isLockedIn = props.rowState === RowState.LockedIn;
  const isEditing = props.rowState === RowState.Editing;
  const letterDivs = props.cluedLetters
    .concat(Array(5).fill({ clue: Clue.Absent, letter: "" }))
    .slice(0, 5)
    .map(({ clue, letter }, i) => {
      let letterClass = "Row-letter";
      if (isLockedIn && clue !== undefined) {
        letterClass += " " + clueClass(clue, props.correctGuess.lastIndexOf(letter) !== -1);
      }

      let knownInfo : Clue | undefined;
      if (!isLockedIn && letter !== "") {
        if ( props.letterInfo.get(letter) === Clue.Absent || props.correctGuess.lastIndexOf(letter) !== -1 ) {
          knownInfo = Clue.Absent;
        } else {
          for(let prevClue of props.cluedRows) {
            if (prevClue.length <= i )
              continue;
            if ( prevClue[i].letter == letter ) {
              if (prevClue[i].clue === Clue.Absent ) {
                knownInfo = Clue.Absent;
              } else if (prevClue[i].clue === Clue.Correct && knownInfo !== Clue.Absent) {
                knownInfo = Clue.Correct;
              } else if (prevClue[i].clue === Clue.Elsewhere && knownInfo === undefined) {
                knownInfo = Clue.Elsewhere;
              } 
            }
          }       
        }
      }

      if (knownInfo === Clue.Elsewhere ) {
        letterClass += " Typing-known-elsewhere";
      } else if (knownInfo === Clue.Absent ) {
        letterClass += " Typing-known-absent";
      } else if (knownInfo === Clue.Correct ) {
        letterClass += " Typing-known-correct";
      }

      return (
        <td
          key={i}
          className={letterClass}
          aria-live={isEditing ? "assertive" : "off"}
          aria-label={
            isLockedIn
              ? letter.toUpperCase() +
                (clue === undefined ? "" : ": " + clueWord(clue))
              : ""
          }
        >
        {nightmare && isLockedIn && (<span>{glitch(letter)}</span>)}
        {!(nightmare && isLockedIn) && (<span>{letter}</span>)}
        </td>
      );
    });
  let rowClass = "Row";
  if (isLockedIn) rowClass += " Row-locked-in";
  if (props.rowNumber < props.numInitialGuesses) rowClass  += " Row-initial-guess";
  return (
    <tr className={rowClass}>
      {letterDivs}
      {!props.annotation && <td className="Row-annotation">{'\u00a0'}</td>}
      {props.annotation &&  
        <td className="Row-annotation">
            {glitch(props.annotation)}
        </td>
      }
    </tr>
  );
}
