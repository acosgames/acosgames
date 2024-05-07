import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";


function FSGSubmit(props) {

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
            <Button
                disabled={loading}
                className="submit"
                color={props.color}
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
            </Button>
        </div>
    )
}

export default FSGSubmit;