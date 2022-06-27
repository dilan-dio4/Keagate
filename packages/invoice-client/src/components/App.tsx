import { Flowbite } from 'flowbite-react';
import { Toaster } from 'react-hot-toast';
import Invoice from './Invoice';
import '../styles/globals.css';

function App() {
    return (
        <Flowbite>
            <Invoice />
            <Toaster
                position='bottom-center'
                toastOptions={{
                    style: {
                        fontFamily:
                            'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                    },
                    className: 'text-sm tracking-tight text-slate-700',
                }}
            />
        </Flowbite>
    );
}

export default App;
