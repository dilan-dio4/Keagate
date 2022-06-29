import context from "./context"
import GenericCoinlibWrapper from "./transactionalWallets/coinlib/GenericCoinlibWrapper";
import GenericTransactionalWallet from "./transactionalWallets/GenericTransactionalWallet";
import dayjs, { Dayjs } from "dayjs";
import { PaymentStatusType } from "@firagate/common/src";
import { delay } from './utils';
import config from "./config";

class ActivityLoop {
    private needsToStop = false;
    private lastBatchStart: Dayjs;

    public start() {
        this.startBatch();
    }

    public stop() {
        this.needsToStop = true
    }

    private async startBatch() {
        if (this.needsToStop) {
            this.needsToStop = false;
            return;
        }
        
        this.lastBatchStart = dayjs();
        for (const aTrx of Object.values(context.activePayments)) {
            await this.checkSingleTransaction(aTrx);
        }

        const howLongTheBatchTook = dayjs().diff(this.lastBatchStart, 'millisecond');
        if (howLongTheBatchTook < config.getTyped('TRANSACTION_MIN_REFRESH_TIME')) {
            console.log("Waiting for min refresh time")
            await delay(config.getTyped('TRANSACTION_MIN_REFRESH_TIME') - howLongTheBatchTook);
        }
        this.startBatch();
    }

    private checkSingleTransaction(trx: GenericTransactionalWallet | GenericCoinlibWrapper): Promise<PaymentStatusType> {
        return new Promise((resolve, reject) => {
            const runner = async () => {
                let _status: PaymentStatusType;
                try {
                    await trx.checkTransaction(status => _status = status)
                } catch (error) {
                    _status = undefined;
                }
                if (_status) {
                    resolve(_status);
                } else {
                    await delay(3000); // TODO: Config
                    runner();
                }
            }
            console.log("Checking transaction: ", trx.getDetails().id);
            runner();
        })
    }
}

export default new ActivityLoop()