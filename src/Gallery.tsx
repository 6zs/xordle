import { GameState, imageUrls } from "./Game";
import { GetDaynum } from "./Stats";
import { todayDayNum } from "./util";

export function Gallery() {
  const galleryDivs = new Array(todayDayNum-1).fill(undefined)
  .map((_,i) => {
    let day = GetDaynum(i+1);
    let linkurl = "?x=" + (i+1);
    if ( !day || day.gameState === GameState.Playing) {
      return (
        <div>
          <p><a href={linkurl}>Day {i+1}</a></p>
          <p>Not Played</p>
          <hr/>
        </div>);
    }
    let [preview, original] = imageUrls(i+1);

    return (
      <div>
        <p><a href={linkurl}>Day {i+1}</a></p>
        <p>        
        {day.puzzle.initialGuesses.map(s=>s.toUpperCase()).join(", ")} » {day.puzzle.targets[0].toUpperCase()} + {day.puzzle.targets[1].toUpperCase()}</p>
        <a className="rewardImageLink" href={original} target="_blank">
          <img className="rewardImage" src={preview}/>
        </a>
        <hr/>
      </div>
    );
  }).reverse();
  return (
    <div className="Gallery">
        {galleryDivs}
    </div>
  );
}
