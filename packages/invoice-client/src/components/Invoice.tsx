import { Spinner, Alert } from "flowbite-react";
import { ReactComponent as BtcIcon } from 'cryptocurrency-icons/svg/color/btc.svg';
import { ReactComponent as SolIcon } from 'cryptocurrency-icons/svg/color/sol.svg';
import { ReactComponent as LtcIcon } from 'cryptocurrency-icons/svg/color/ltc.svg';
import { ReactComponent as AdaIcon } from 'cryptocurrency-icons/svg/color/ada.svg';
import { ReactComponent as DashIcon } from 'cryptocurrency-icons/svg/color/dash.svg';

import { BiTimer, BiCopy } from 'react-icons/bi';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { HiInformationCircle } from 'react-icons/hi';
import dayjs from "dayjs";
import clsx from 'clsx';
import React, { useState, useEffect } from "react";
import { copyToClipboard } from '../utils/utils';
import useAsyncEffect from "use-async-effect";
import { AvailableTickers, currencies, fGet, PaymentStatusType } from '@snow/common/src';
import ReactPlaceholder from 'react-placeholder';
import "react-placeholder/lib/reactPlaceholder.css";

export default function Invoice() {
    const isTransactionDead = false;
    const payAmount = 0.0001;
    const payAddress = "3DkEkHTRxzsPc4T8mGaGKdhUfJs6vW6JBJ";

    const currencyToIcon: Record<AvailableTickers, React.ReactChild> = {
        dash: <DashIcon width={50} height={50} />,
        ltc: <LtcIcon width={50} height={50} />,
        sol: <SolIcon width={50} height={50} />
    }

    const [isBlockchainInfoOpen, setIsBlockchainInfoOpen] = useState<boolean>(false);
    const [currency, setCurrency] = useState<AvailableTickers | "">("");
    const [invoiceId, setInvoiceId] = useState<string>("");
    interface IInvoiceObject {
        amount: number;
        amountPaid: number;
        currency: AvailableTickers;
        expiresAt: string;
        publicKey: string;
        status: PaymentStatusType;
    }
    const [invoiceObject, setInvoiceObject] = useState<IInvoiceObject>();

    const blockchainDetails: { key: string, value: string, Component: any }[] = [];
    if (currency) {
        currencies[currency]?.networkName && blockchainDetails.push({ key: "Network Name", value: currencies[currency].networkName, Component: (props: any) => <span {...props} /> })
        blockchainDetails.push({ key: "Full Name", value: currencies[currency].name, Component: (props: any) => <span {...props} /> })
        blockchainDetails.push({ key: "Ticker", value: currency.toUpperCase(), Component: (props: any) => <span {...props} /> })
        blockchainDetails.push({ key: "Chain Explorer", value: currencies[currency].explorer, Component: (props: any) => <a {...props} href={currencies[currency].explorer} target="_blank" /> })
    }

    useEffect(() => {
        const params = window.location.pathname.split('/');
        const _invoiceId = params.pop();
        setInvoiceId(_invoiceId);
        const _currency = params.pop().toLowerCase();
        setCurrency(_currency as AvailableTickers);

        // eslint-disable-next-line prefer-const
        let interval: NodeJS.Timer;
        async function runner() {
            const _invoiceObj = await fGet(`/getInvoiceStatus?invoiceId=${_invoiceId}`) as IInvoiceObject;
            setInvoiceObject(_invoiceObj);
            if (_invoiceObj.status === "CONFIRMED" || _invoiceObj.status === "FAILED" || _invoiceObj.status === "FINISHED") {
                clearInterval(interval);
            }
        }
        runner();
        interval = setInterval(runner, 6000);
        return () => clearInterval(interval);
    }, [])

    return (
        <div className="overflow-hidden max-w-full mx-auto sm:my-14 sm:border sm:rounded-lg sm:max-w-[500px]">
            <div className="bg-indigo-500 text-center py-2.5 text-white">
                <span className="flex justify-center items-center">
                    <Spinner color="pink" className="status-spinner" />
                    <p className="ml-3 text-sm font-medium sm:text-lg sm:font-semibold">Awaiting for payment confirmation</p>
                </span>
            </div>
            <div className="border-b flex justify-between items-center py-4 px-5">
                <div className="flex items-center">
                    <ReactPlaceholder type='round' showLoadingAnimation ready={!!currency} style={{ width: 50, height: 50 }}>
                        {currencyToIcon[currency]}
                    </ReactPlaceholder>
                    <div className="ml-2">
                        <p className="tracking-tight"><b>Invoice</b></p>
                        <ReactPlaceholder type="text" ready={!!invoiceObject} showLoadingAnimation style={{ width: 50 }}>
                            <p 
                                className="text-slate-600 cursor-pointer hover:text-slate-800 tracking-tight"
                                onClick={_ => copyToClipboard(invoiceId, "Copied invoice ID to clipboard")}
                            >
                                {invoiceId.slice(0, 3)}{String.fromCharCode(8230)}{invoiceId.slice(-3)}
                            </p>
                        </ReactPlaceholder>
                    </div>
                </div>
                <div>
                    <p className="tracking-tight"><b>Expires at</b></p>
                    <p className="flex items-center text-slate-600 tracking-tight">
                        <BiTimer size={20} className="mr-1" />
                        {invoiceObject ? dayjs(invoiceObject.expiresAt).format("h:mm A") : ""}
                    </p>
                </div>
            </div>
            <div className="px-5 py-4">
                <div className={clsx("cursor-pointer flex justify-between items-center px-4 py-3", isBlockchainInfoOpen ? "border-x border-t rounded-t-md" : "border rounded-md")} onClick={_ => setIsBlockchainInfoOpen(prev => !prev)}>
                    <p className="font-bold">Blockchain Details</p>
                    {isBlockchainInfoOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                </div>
                <div className={clsx(isBlockchainInfoOpen ? "h-[140px] border-x border-b rounded-b-md" : "h-0", "transition-all ease-in-out duration-200 overflow-hidden")}>
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

            <div className="bg-slate-100 py-8 px-5 h-full">
                <div className="rounded-md bg-white py-5">
                    <div className="text-center px-4">
                        <p className="tracking-tight mb-0.5">Amount:</p>
                        <ReactPlaceholder type="text" showLoadingAnimation ready={!!invoiceObject} style={{ width: 50, height: 10 }}>
                            <p
                                className={clsx("text-lg font-bold transition-colors", isTransactionDead ? "text-gray-400" : "text-black cursor-pointer hover:text-gray-500")}
                                onClick={_ => !isTransactionDead && copyToClipboard("" + payAmount, "Copied value to clipboard")}
                            >
                                {payAmount} {currency.toUpperCase()} {!isTransactionDead && <BiCopy className="inline-block mb-1" size={16} />}
                            </p>
                        </ReactPlaceholder>
                    </div>
                    <div className="h-[1px] bg-slate-200 my-5 mx-5"></div>
                    <div className="text-center px-4">
                        <p className="tracking-tight mb-1.5">Payment Address:</p>
                        <p
                            className={clsx("transition-colors font-semibold mt-1.5 text-xs leading-tight tracking-wide break-all", isTransactionDead ? "text-gray-400" : "cursor-pointer text-blue-500 hover:text-blue-600")}
                            onClick={_ => !isTransactionDead && copyToClipboard(payAddress, "Copied address to clipboard")}
                        >
                            {payAddress}
                            {!isTransactionDead && <BiCopy className="ml-0.5 mb-[1px] inline-block" size={12} />}
                        </p>
                    </div>
                    <div className="text-center px-4 mt-6 alert-root">
                        <Alert color="blue" icon={HiInformationCircle}>
                            <span className="font-normal tracking-tight text-xs text-center w-full">
                                Please verify the address and amount before sending the transaction.
                            </span>
                        </Alert>
                    </div>
                </div>
                <div className="flex mt-10">
                    <div className="basis-5/12 text-center">
                        <p className="text-sm text-slate-600 tracking-tight">Amount collected:</p>
                        <p className="text-md font-bold">0.00000000 {currency.toUpperCase()}</p>
                    </div>
                    <div className="basis-2/12 flex justify-center">
                        <div className="h-full bg-slate-300 w-[3px] rounded-md"></div>
                    </div>
                    <div className="basis-5/12 text-center">
                        <p className="text-sm text-slate-600 tracking-tight">Amount due:</p>
                        <p
                            className={clsx("text-md font-bold transition-colors", isTransactionDead ? "text-gray-400" : "text-black cursor-pointer hover:text-gray-500")}
                            onClick={_ => !isTransactionDead && copyToClipboard("" + payAmount, "Copied value to clipboard")}
                        >
                            0.00000000 {currency.toUpperCase()} {!isTransactionDead && <BiCopy className="inline-block mb-1" size={15} />}
                        </p>
                    </div>
                </div>
                <h1 className="text-xs font-bold text-center text-slate-600 mt-12 tracking-tight">Powered by open-source software <a href="https://github.com/dilan-dio4/Snow">Snow</a></h1>
            </div>
            <div className="bottom-0 absolute w-full -z-10 h-[20vh] bg-slate-100 sm:hidden sm:invisible"></div>
        </div>
    )
}