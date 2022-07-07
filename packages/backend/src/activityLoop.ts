import context from './context';
import GenericTransactionalWallet from './transactionalWallets/GenericTransactionalWallet';
import dayjs, { Dayjs } from 'dayjs';
import { PaymentStatusType, availableNativeCurrencies } from '@keagate/common';
import { delay } from './utils';
import config from './config';

class ActivityLoop {
    private needsToStop = false;
    private lastBatchStart: Dayjs;

    public start() {
        this.startBatch();
    }

    public stop() {
        this.needsToStop = true;
    }

    private async runTxsCohort(cohort: GenericTransactionalWallet[]) {
        for (const aTrx of cohort) {
            await this.checkSingleTransaction(aTrx);
        }
    }

    private async startBatch() {
        if (this.needsToStop) {
            this.needsToStop = false;
            return;
        }

        this.lastBatchStart = dayjs();

        const txsByCohort: Record<typeof availableNativeCurrencies[number] | 'coinlib', GenericTransactionalWallet[]> = {
            coinlib: [],
            MATIC: [],
            SOL: [],
        };

        for (const aTrx of Object.values(context.activePayments)) {
            const { type, currency } = aTrx.getDetails();
            if (type === 'coinlib') {
                txsByCohort[type].push(aTrx);
            } else {
                txsByCohort[currency].push(aTrx);
            }
        }

        await Promise.all(Object.values(txsByCohort).map((cohort) => this.runTxsCohort(cohort)));

        const howLongTheBatchTook = dayjs().diff(this.lastBatchStart, 'millisecond');
        if (howLongTheBatchTook < config.getTyped('TRANSACTION_MIN_REFRESH_TIME')) {
            console.log('Waiting for min refresh time');
            await delay(config.getTyped('TRANSACTION_MIN_REFRESH_TIME') - howLongTheBatchTook);
        }
        this.startBatch();
    }

    private checkSingleTransaction(trx: GenericTransactionalWallet): Promise<PaymentStatusType> {
        return new Promise((resolve, reject) => {
            const runner = async () => {
                let _status: PaymentStatusType;
                try {
                    await trx.checkTransaction((status) => (_status = status));
                } catch (error) {
                    _status = undefined;
                }
                if (_status) {
                    resolve(_status);
                } else {
                    await delay(config.getTyped('BLOCKBOOK_RETRY_DELAY'));
                    runner();
                }
            };
            console.log('Checking transaction: ', trx.getDetails().id);
            runner();
        });
    }
}

export default new ActivityLoop();
