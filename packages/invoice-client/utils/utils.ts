import customToast from "../components/customToast";

const isDev = process.env.NODE_ENV === 'development';

const copyToClipboard = (value: string, successText: string) => {
    if (!navigator.clipboard) {
        const myInput = document.createElement('input');
        myInput.setAttribute('value', value);
        myInput.setAttribute('hidden', 'true');
        myInput.style.display = 'none';
        myInput.style.visibility = 'hidden';
        document.body.appendChild(myInput);
        myInput.select();
        try {
            document.execCommand('copy');
            customToast({ content: successText, type: "success" });
        } catch (error) {
            console.error(error);
            customToast({ content: 'Error copying', type: "error" })
        } finally {
            document.body.removeChild(myInput);
        }
    } else {
        navigator.clipboard.writeText(value).then(() => {
            customToast({ content: successText, type: "success" });
        }, (error) => {
            console.error(error);
            customToast({ content: 'Error copying', type: "error" })
        });
    }
}

export {
    isDev,
    copyToClipboard
};
