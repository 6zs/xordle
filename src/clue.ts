export enum Clue {
  Absent,
  Elsewhere,
  Correct,
}

export interface CluedLetter {
  clue?: Clue;
  letter: string;
}

export function clue(word: string, target: string): CluedLetter[] {
  let elusive: string[] = [];
  target.split("").forEach((letter, i) => {
    if (word[i] !== letter) {
      elusive.push(letter);
    }
  });
  return word.split("").map((letter, i) => {
    let j: number;
    if (target[i] === letter) {
      return { clue: Clue.Correct, letter };
    } else if ((j = elusive.indexOf(letter)) > -1) {
      // "use it up" so we don't clue at it twice
      elusive[j] = "";
      return { clue: Clue.Elsewhere, letter };
    } else {
      return { clue: Clue.Absent, letter };
    }
  });
}

export function xorclue(clue1: CluedLetter[], clue2: CluedLetter[]): CluedLetter[] {
  return clue1.map((cluedLetter,i) => {
    if (cluedLetter !== clue2[i]) {
      if ( cluedLetter.clue === Clue.Correct || clue2[i].clue === Clue.Correct ) {
        return { clue: Clue.Correct, letter: cluedLetter.letter };
      }
      if ( cluedLetter.clue === Clue.Elsewhere || clue2[i].clue === Clue.Elsewhere ) {
        return { clue: Clue.Elsewhere, letter: cluedLetter.letter };
      }
      /*TODO* add more states?*/
    }
    return { clue: Clue.Absent, letter: cluedLetter.letter };
  });
}

export function clueClass(clue: Clue): string {
  if (clue === Clue.Absent) {
    return "letter-absent";
  } else if (clue === Clue.Elsewhere) {
    return "letter-elsewhere";
  } else {
    return "letter-correct";
  }
}

export function clueWord(clue: Clue): string {
  if (clue === Clue.Absent) {
    return "no";
  } else if (clue === Clue.Elsewhere) {
    return "elsewhere";
  } else {
    return "correct";
  }
}

export function describeClue(clue: CluedLetter[]): string {
  return clue
    .map(({ letter, clue }) => letter.toUpperCase() + " " + clueWord(clue!))
    .join(", ");
}
