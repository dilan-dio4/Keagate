import { availableNativeCurrencies } from "@keagate/common/src";
import Bottleneck from "bottleneck";

interface ILimiterDetails {
    rateLimit: number;
    maxRetries: number;
    maxConcurrent: number;
}

const limiterDetails: Record<typeof availableNativeCurrencies[number], ILimiterDetails> = {
    SOL: {
        maxConcurrent: 1,
        maxRetries: 5,
        rateLimit: 500
    },
    MATIC: {
        maxConcurrent: 1,
        maxRetries: 5,
        rateLimit: 500
    },
}

function generateLimiter(ILimiterDetails: ILimiterDetails) {
    const RATE_LIMIT = ILimiterDetails.rateLimit;

    const limiter = new Bottleneck({
        minTime: RATE_LIMIT,
        maxConcurrent: ILimiterDetails.maxConcurrent
    })
    
    limiter.on('failed', async (error, jobInfo) => {
        if (jobInfo.retryCount < ILimiterDetails.maxRetries) {
            return RATE_LIMIT + (jobInfo.retryCount * 100)
        }
    })
    
    return limiter;
}

const limiters: Record<typeof availableNativeCurrencies[number], Bottleneck> = {
    MATIC: generateLimiter(limiterDetails.MATIC),
    SOL: generateLimiter(limiterDetails.SOL),
};

export default limiters;
