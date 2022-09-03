import { useState } from "react";


function FSGDelete(props) {

    let [loading, setLoading] = useState(false);

    let title = props.title || 'Delete';
    if (loading) {
        title = props.loadingTitle || 'Deleting';
    }
    return (
        <div className="form-row">
            <button
                disabled={loading}
                className="delete"
                onClick={async (e) => {
                    setLoading(true);
                    try {
                        await props.onClick(e)
                    }
                    catch (err) {
                        console.error(err);
                    }

                }}>
                {title}
            </button>
        </div>
    )
}

export default FSGDelete;