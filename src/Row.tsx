import { Clue, clueClass, CluedLetter, clueWord } from "./clue";

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
        {letter}
        </td>
      );
    });
  let rowClass = "Row";
  if (isLockedIn) rowClass += " Row-locked-in";
  return (
    <tr className={rowClass}>
      {letterDivs}
      {!props.annotation && <span className="Row-annotation">{'\u00a0'}</span>}
      {props.annotation &&  (
        <span className="Row-annotation">
          <span className="stack stacks3">            
            <span className="index0">{props.annotation}</span>
            <span className="index1">{props.annotation}</span>
            <span className="index2">{props.annotation}</span>
          </span>
        </span>
      )}
    </tr>
  );
}
