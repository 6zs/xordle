import { prependOnceListener } from "process"

interface PopUpProps {
    title: string;
    text: string;
    onClick: () => void;
}
  
export function PopUp(props: PopUpProps) {
    return (
        <div className="popup-overlay">
            <div className="popup">
                <h2>{props.title}</h2>
                <a className="popup-close" onClick={props.onClick}>&times;</a>
                <div className="popup-content">
                    <p>{props.text}</p>
                </div>
            </div>
        </div>
    );
}

export default PopUp;