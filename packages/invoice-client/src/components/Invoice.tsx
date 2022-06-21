import customToast from './customToast';
import { Button } from 'flowbite-react';

export default function Invoice() {
    return (
        <>
            <h2 onClick={() => customToast({ content: "Test", "type": "success" })}>test 2</h2>
            <Button gradientMonochrome="blue" outline size="xs" >Hello</Button>
        </>
    )
}