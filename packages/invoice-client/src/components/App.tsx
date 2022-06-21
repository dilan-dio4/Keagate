import { Flowbite } from "flowbite-react";
import { Toaster } from "react-hot-toast";
import Invoice from "./Invoice";
import '../../styles/globals.css';

function App() {
    return (
        <Flowbite>
            <Invoice />
            <Toaster position="bottom-center" />
        </Flowbite>
    )
}

export default App