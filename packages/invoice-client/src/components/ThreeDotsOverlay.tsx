import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface IThreeDotsOverlay {
    showDots: boolean;
    flashDots?: boolean;
    text?: string | JSX.Element;
    className?: string;
}

export default function ThreeDotsOverlay({ showDots, text, className, flashDots }: IThreeDotsOverlay) {
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout((_) => setMounted(true), 100); // Dirty hack to force transition
        return () => clearTimeout(timer);
    }, []);

    const overlayStyle: React.CSSProperties = {
        zIndex: 1,
        backgroundColor: '#ffffff',
        position: 'fixed',
        right: 0,
        left: 0,
        bottom: 0,
        top: 0,
        WebkitTapHighlightColor: 'transparent',
    };

    const textStyle: React.CSSProperties = {
        color: '#a3a1a1',
        whiteSpace: 'break-spaces',
        margin: 'auto',
        position: 'absolute',
        paddingTop: 127,
        paddingLeft: 10,
        paddingRight: 10,
        transition: 'opacity 550ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        opacity: mounted ? 1 : 0,
    };

    return (
        <div style={overlayStyle} className={clsx('flex', 'justify-center', 'items-center', className)}>
            {showDots && (
                <div className={clsx('dots-loader', flashDots && 'flash-please')}>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            )}
            <p style={textStyle} className='text-center'>
                {text || ''}
            </p>
        </div>
    );
}
