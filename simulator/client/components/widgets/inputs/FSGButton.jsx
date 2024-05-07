import { useEffect, useState } from "react";


function FSGButton(props) {

    let [loading, setLoading] = useState(false);

    let title = props.title || 'Save';
    if (loading) {
        title = props.loadingTitle || 'Saving';
    }

    var mounted = true;

    useEffect(() => {
        mounted = true;
        return () => {
            mounted = false;
        }
    }, []);

    return (
        <div className="form-row">
            <button
                disabled={loading}
                className={props.className || "submit"}
                onClick={async (e) => {
                    setLoading(true);
                    try {
                        await props.onClick(e)
                    }
                    catch (err) {
                        console.error(err);
                        return;
                    }

                    if (mounted)
                        setLoading(false);
                }}>
                {title}
            </button>
        </div>
    )
}

export default FSGButton;