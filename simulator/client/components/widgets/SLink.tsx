import { useNavigate } from "react-router-dom";

interface SLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    children?: React.ReactNode;
}

const SLink = (props: SLinkProps) => {
    const navigate = useNavigate();
    const { to, children, ...rest } = props;

    return (
        <a
            onClick={() => {
                navigate(to);
            }}
            {...rest}
        >
            {children}
        </a>
    );
};

export default SLink;
