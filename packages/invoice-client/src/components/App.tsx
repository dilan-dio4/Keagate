import { Flowbite } from "flowbite-react";
import { Toaster } from "react-hot-toast";
import Invoice from "./Invoice";
import '../../styles/globals.css';

function App() {
    return (
        <div className="bg-white">
            <Flowbite>
                <Invoice />
                <Toaster position="bottom-center" />
            </Flowbite>
            <div className="py-16 px-4 mx-auto max-w-screen-xl sm:py-24 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-base font-semibold tracking-wide text-blue-600 uppercase">
                        Welcome to
                    </h2>
                    <p className="my-3 text-4xl font-bold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        reactjs-vite-tailwindcss-boilerplate
                    </p>
                    <p className="text-xl text-gray-400">Start building for free.</p>
                    <p className="mt-5">
                    </p>
                </div>
            </div>
        </div>
    )
}

export default App