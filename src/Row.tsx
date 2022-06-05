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
  correctGuess: string;
  annotation?: string;
  rowNumber: number;
  numInitialGuesses: number;
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
