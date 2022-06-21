import customToast from './customToast';
import { Spinner, Button } from "flowbite-react";
import { ReactComponent as BtcIcon } from 'cryptocurrency-icons/svg/color/btc.svg';
import currencies from '../../../backend/src/currencies';
import { BiTimer } from 'react-icons/bi';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import dayjs from "dayjs";
import clsx from 'clsx';
import { useState } from "react";

export default function Invoice() {
    const coin = "sol";
    const [isBlockchainInfoOpen, setIsBlockchainInfoOpen] = useState<boolean>(false);
    const blockchainDetails: { key: string, value: string, Component: any }[] = [];
    currencies[coin].networkName && blockchainDetails.push({ key: "Network Name", value: currencies[coin].networkName, Component: (props: any) => <span {...props} /> })
    blockchainDetails.push({ key: "Full Name", value: currencies[coin].name, Component: (props: any) => <span {...props} /> })
    blockchainDetails.push({ key: "Ticker", value: coin.toUpperCase(), Component: (props: any) => <span {...props} /> })
    blockchainDetails.push({ key: "Chain Explorer", value: currencies[coin].explorer, Component: (props: any) => <a {...props} href={currencies[coin].explorer} target="_blank" /> })
    return (
        <div className="sm:max-w-[500px] max-w-full mx-auto sm:my-14 sm:border sm:rounded-md overflow-hidden">
            <div className="bg-indigo-500 text-center py-2 text-white">
                <span className="flex justify-center items-center">
                    <Spinner color="pink" className="status-spinner" />
                    <p className="ml-3 text-sm font-medium sm:text-lg sm:font-semibold">Awaiting for payment confirmation</p>
                </span>
            </div>
            <div className="border-b flex justify-between items-center p-4">
                <div className="flex items-center">
                    <BtcIcon width={50} />
                    <div className="ml-2">
                        <p><b>Invoice</b></p>
                        <p className="text-slate-600">#98970</p>
                    </div>
                </div>
                <div>
                    <p><b>Expires at</b></p>
                    <p className="flex items-center text-slate-600">
                        <BiTimer size={20} className="mr-1" />
                        {dayjs().format("h:mm A")}
                    </p>
                </div>
            </div>
            <div className="px-2 py-4">
                <div className={clsx("cursor-pointer flex justify-between items-center px-4 py-3", isBlockchainInfoOpen ? "border-x border-t rounded-t-md" : "border rounded-md")} onClick={_ => setIsBlockchainInfoOpen(prev => !prev)}>
                    <p className="font-bold">Blockchain Details</p>
                    {isBlockchainInfoOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                </div>
                <div className={clsx(isBlockchainInfoOpen ? "h-[160px] border-x border-b rounded-b-md" : "h-0", "transition-all ease-in-out duration-200 overflow-hidden")}>
                    <div className="px-4 py-3">
                        {blockchainDetails.map(({ Component, ...ele }) => (
                            <span className="text-sm flex pb-2" key={ele.key}>
                                <p className="w-[150px] font-bold">{ele.key}:</p>
                                <Component>{ele.value}</Component>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <h2 onClick={() => customToast({ content: "Test", "type": "success" })}>test 2</h2>
            <Button gradientMonochrome="blue" outline size="xs">Hello</Button>
        </div>
    )
}