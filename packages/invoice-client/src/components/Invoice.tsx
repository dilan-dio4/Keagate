import { Spinner, Alert } from 'flowbite-react';
import { ReactComponent as BtcIcon } from 'cryptocurrency-icons/svg/color/btc.svg';
import { ReactComponent as SolIcon } from 'cryptocurrency-icons/svg/color/sol.svg';
import { ReactComponent as LtcIcon } from 'cryptocurrency-icons/svg/color/ltc.svg';
import { ReactComponent as AdaIcon } from 'cryptocurrency-icons/svg/color/ada.svg';
import { ReactComponent as DashIcon } from 'cryptocurrency-icons/svg/color/dash.svg';
import { ReactComponent as XrpIcon } from 'cryptocurrency-icons/svg/color/xrp.svg';
import { ReactComponent as TrxIcon } from 'cryptocurrency-icons/svg/color/trx.svg';

import { BiTimer, BiCopy } from 'react-icons/bi';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { HiInformationCircle } from 'react-icons/hi';
import dayjs from 'dayjs';
import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { copyToClipboard } from '../utils/utils';
// import useAsyncEffect from "use-async-effect";
import { AvailableCurrencies, currencies, fGet, PaymentStatusType } from '@firagate/common/src';
import ThreeDotsOverlay from './ThreeDotsOverlay';

export default function Invoice() {
    const currencyToIcon: Record<AvailableCurrencies, React.ReactChild> = {
        DASH: <DashIcon width={50} height={50} />,
        LTC: <LtcIcon width={50} height={50} />,
        SOL: <SolIcon width={50} height={50} />,
        ADA: <AdaIcon width={50} height={50} />,
        BTC: <BtcIcon width={50} height={50} />,
        XRP: <XrpIcon width={50} height={50} />,
        TRX: <TrxIcon width={50} height={50} />
    };

    const [isBlockchainInfoOpen, setIsBlockchainInfoOpen] = useState<boolean>(false);
    const [isTransactionDead, setIsTransactionDead] = useState<boolean>(false);
    const [currency, setCurrency] = useState<AvailableCurrencies>();
    const [invoiceId, setInvoiceId] = useState<string>('');
    interface IInvoiceObject {
        amount: number;
        amountPaid: number;
        currency: AvailableCurrencies;
        expiresAt: string;
        publicKey: string;
        status: PaymentStatusType;
        invoiceCallbackUrl?: string;
    }
    const [invoiceObject, setInvoiceObject] = useState<IInvoiceObject>();

    useEffect(() => {
        const params = window.location.pathname.split('/');
        const _invoiceId = params.pop();
        setInvoiceId(_invoiceId);
        const _currency = params.pop().toUpperCase();
        setCurrency(_currency as AvailableCurrencies);

        // eslint-disable-next-line prefer-const
        let interval: NodeJS.Timer;
        async function runner() {
            const _invoiceObj = (await fGet(`/getInvoiceStatus?invoiceId=${_invoiceId}`)) as IInvoiceObject;
            setInvoiceObject(_invoiceObj);
            document.title = `Payment ${_invoiceObj.status.toLowerCase().replace('_', ' ')}`;
            if (
                _invoiceObj.status === 'CONFIRMED' ||
                _invoiceObj.status === 'FAILED' ||
                _invoiceObj.status === 'FINISHED' ||
                _invoiceObj.status === 'SENDING' ||
                _invoiceObj.status === 'EXPIRED'
            ) {
                clearInterval(interval);
                setIsTransactionDead(true);
                if (invoiceObject.invoiceCallbackUrl) {
                    window.location.href = invoiceObject.invoiceCallbackUrl + `?status=${_invoiceObj.status}`;
                }
            }
        }
        runner();
        interval = setInterval(runner, 6000);
        return () => clearInterval(interval);
    }, []);

    if (!invoiceObject || !currency) {
        return <ThreeDotsOverlay showDots flashDots />;
    }

    const blockchainDetails: { key: string; value: string; Component: React.FC }[] = [];
    type SpanProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
    type AProps = React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
    currencies[currency]?.networkName &&
        blockchainDetails.push({
            key: 'Network Name',
            value: currencies[currency].networkName,
            Component: (props: SpanProps) => <span {...props} />,
        });
    blockchainDetails.push({
        key: 'Full Name',
        value: currencies[currency].name,
        Component: (props: SpanProps) => <span {...props} />,
    });
    blockchainDetails.push({
        key: 'Ticker',
        value: currency,
        Component: (props: SpanProps) => <span {...props} />,
    });
    blockchainDetails.push({
        key: 'Chain Explorer',
        value: currencies[currency].explorer,
        Component: (props: AProps) => <a {...props} href={currencies[currency].explorer} target='_blank' />,
    });

    function getSpinnerText(): string {
        switch (invoiceObject.status) {
            case 'WAITING':
                return 'Awaiting for payment confirmation';
            case 'PARTIALLY_PAID':
                return 'Payment partially fulfilled';
            case 'EXPIRED':
                return 'Invoice expired';
            case 'CONFIRMING':
                return 'Confirming transaction';
            case 'CONFIRMED':
            case 'SENDING':
            case 'FINISHED':
                return 'Successfully confirmed transaction';
            case 'FAILED':
                return 'Payment failed';
        }
    }

    function isSpinnerBackgroundRed() {
        if (invoiceObject.status === 'EXPIRED' || invoiceObject.status === 'FAILED') {
            return true;
        } else {
            return false;
        }
    }

    return (
        <div className='overflow-hidden max-w-full mx-auto sm:my-14 sm:border sm:rounded-lg sm:max-w-[500px]'>
            <div className={clsx('text-center py-2.5 text-white', isSpinnerBackgroundRed() ? 'bg-red-600' : 'bg-indigo-500')}>
                <span className='flex justify-center items-center'>
                    {!isTransactionDead && <Spinner className='status-spinner' />}
                    <p className='ml-3 text-sm font-medium sm:text-lg sm:font-semibold'>{getSpinnerText()}</p>
                </span>
            </div>
            <div className='border-b flex justify-between items-center py-4 px-5'>
                <div className='flex items-center'>
                    {currencyToIcon[currency]}
                    <div className='ml-2'>
                        <p className='tracking-tight'>
                            <b>Invoice</b>
                        </p>
                        <p
                            className='text-slate-600 cursor-pointer hover:text-slate-800 tracking-tight'
                            onClick={(_) => copyToClipboard(invoiceId, 'Copied invoice ID to clipboard')}
                        >
                            {invoiceId.slice(0, 3)}
                            {String.fromCharCode(8230)}
                            {invoiceId.slice(-3)}
                        </p>
                    </div>
                </div>
                <div>
                    <p className='tracking-tight'>
                        <b>Expires at</b>
                    </p>
                    <p className='flex items-center text-slate-600 tracking-tight'>
                        <BiTimer size={20} className='mr-1' />
                        {dayjs(invoiceObject.expiresAt).format('h:mm A')}
                    </p>
                </div>
            </div>
            <div className='px-5 py-4'>
                <div
                    className={clsx(
                        'cursor-pointer flex justify-between items-center px-4 py-3',
                        isBlockchainInfoOpen ? 'border-x border-t rounded-t-md' : 'border rounded-md',
                    )}
                    onClick={(_) => setIsBlockchainInfoOpen((prev) => !prev)}
                >
                    <p className='font-bold'>Blockchain Details</p>
                    {isBlockchainInfoOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                </div>
                <div
                    className={clsx(
                        isBlockchainInfoOpen ? 'h-[140px] border-x border-b rounded-b-md' : 'h-0',
                        'transition-all ease-in-out duration-200 overflow-hidden',
                    )}
                >
                    <div className='px-4 py-3'>
                        {blockchainDetails.map(({ Component, ...ele }) => (
                            <span className='text-sm flex pb-2' key={ele.key}>
                                <p className='w-[150px] font-bold'>{ele.key}:</p>
                                <Component>{ele.value}</Component>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className='bg-slate-100 py-8 px-5 h-full'>
                <div className='rounded-md bg-white py-5'>
                    <div className='text-center px-4'>
                        <p className='tracking-tight mb-0.5'>Amount:</p>
                        <p
                            className={clsx(
                                'text-lg font-bold transition-colors',
                                isTransactionDead ? 'text-gray-400' : 'text-black cursor-pointer hover:text-gray-500',
                            )}
                            onClick={(_) => !isTransactionDead && copyToClipboard('' + invoiceObject.amount, 'Copied value to clipboard')}
                        >
                            {invoiceObject.amount} {currency} {!isTransactionDead && <BiCopy className='inline-block mb-1' size={16} />}
                        </p>
                    </div>
                    <div className='h-[1px] bg-slate-200 my-5 mx-5'></div>
                    <div className='text-center px-4'>
                        <p className='tracking-tight mb-1.5'>Payment Address:</p>
                        <p
                            className={clsx(
                                'transition-colors font-semibold mt-1.5 text-xs leading-tight tracking-wide break-all',
                                isTransactionDead ? 'text-gray-400' : 'cursor-pointer text-blue-500 hover:text-blue-600',
                            )}
                            onClick={(_) => !isTransactionDead && copyToClipboard(invoiceObject.publicKey, 'Copied address to clipboard')}
                        >
                            {invoiceObject.publicKey}
                            {!isTransactionDead && <BiCopy className='ml-0.5 mb-[1px] inline-block' size={12} />}
                        </p>
                    </div>
                    <div className='text-center px-4 mt-6 alert-root'>
                        <Alert color='blue' icon={HiInformationCircle}>
                            <span className='font-normal tracking-tight text-xs text-center w-full'>
                                Please verify the address and amount before sending the transaction.
                            </span>
                        </Alert>
                    </div>
                </div>
                <div className='flex mt-10'>
                    <div className='basis-5/12 text-center'>
                        <p className='text-sm text-slate-600 tracking-tight'>Amount collected:</p>
                        <p className='text-md font-bold'>
                            {invoiceObject.amountPaid.toFixed(7)} {currency}
                        </p>
                    </div>
                    <div className='basis-2/12 flex justify-center'>
                        <div className='h-full bg-slate-300 w-[3px] rounded-md'></div>
                    </div>
                    <div className='basis-5/12 text-center'>
                        <p className='text-sm text-slate-600 tracking-tight'>Amount due:</p>
                        <p
                            className={clsx(
                                'text-md font-bold transition-colors',
                                isTransactionDead ? 'text-gray-400' : 'text-black cursor-pointer hover:text-gray-500',
                            )}
                            onClick={(_) =>
                                !isTransactionDead && copyToClipboard('' + (invoiceObject.amount - invoiceObject.amountPaid), 'Copied value to clipboard')
                            }
                        >
                            {(invoiceObject.amount - invoiceObject.amountPaid).toFixed(7)} {currency}{' '}
                            {!isTransactionDead && <BiCopy className='inline-block mb-1' size={15} />}
                        </p>
                    </div>
                </div>
                <h1 className='text-xs font-bold text-center text-slate-600 mt-12 tracking-tight'>
                    Powered by open-source software <a href='https://github.com/dilan-dio4/Firagate'>Firagate</a>
                </h1>
            </div>
            <div className='bottom-0 absolute w-full -z-10 h-[20vh] bg-slate-100 sm:hidden sm:invisible'></div>
        </div>
    );
}
