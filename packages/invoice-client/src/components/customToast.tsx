import { Toast, Spinner } from "flowbite-react";
import toast, { Toast as ToastType } from 'react-hot-toast';
import { HiCheck, HiX, HiBell } from 'react-icons/hi';

const statusIcons = {
    success: (
        <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-800 text-green-200">
            <HiCheck className="h-5 w-5" />
        </div>
    ),
    error: (
        <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-800 text-red-200">
            <HiX className="h-5 w-5" />
        </div>
    ),
    info: (
        <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-800 text-blue-200">
            <HiBell className="h-5 w-5" />
        </div>
    ),
    loading: (
        <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center">
            <Spinner size="md" />
        </div>
    )
}

export interface IToast {
    content: JSX.Element | JSX.Element[] | React.ReactChild;
    onDismiss?: () => any;
    type: "success" | "error" | "info" | "loading";
    options?: Partial<Pick<ToastType, "id" | "icon" | "duration" | "ariaProps" | "className" | "style" | "position" | "iconTheme">>;
}

const customToast = (props: IToast) => toast.custom(t => (
    <Toast className={t.visible ? 'animate-enter' : 'animate-leave'}>
        {statusIcons[props.type]}
        <div className="ml-3 text-sm font-normal">
            {props.content}
        </div>
        <Toast.Toggle onClick={() => { toast.dismiss(t.id); props.onDismiss && props.onDismiss(); }} />
    </Toast>
), props.options)

export default customToast;
