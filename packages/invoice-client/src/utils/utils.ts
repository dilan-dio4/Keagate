import toast from "react-hot-toast";

export const copyToClipboard = (value: string, successText: string) => {
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
            toast.success(successText);
        } catch (error) {
            console.error(error);
            toast.error('Error copying');
        } finally {
            document.body.removeChild(myInput);
        }
    } else {
        navigator.clipboard.writeText(value).then(() => {
            toast.success(successText)
        }, (error) => {
            console.error(error);
            toast.error('Error copying')
        });
    }
}
