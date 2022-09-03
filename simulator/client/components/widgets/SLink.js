import {
    useHistory
} from "react-router-dom";


var SLink = (props) => {
    const history = useHistory();

    let to = props.to;
    return (
        <a onClick={() => {
            history.push(to);
        }} {...props}>{props.children}</a>
    )
}

export default SLink;