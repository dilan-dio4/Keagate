import { MyConfig, availableCoinlibCurrencies, availableNativeCurrencies, AvailableCurrencies, currencies } from '@keagate/common';
import prompts from 'prompts';

export default async function setupWallets(): Promise<Partial<MyConfig>> {
    // eslint-disable-next-line no-constant-condition
    const { selectedCurrencies } = await prompts({
        type: "multiselect",
        name: "selectedCurrencies",
        message: "Which currencies would you like to configure. (You can add more later)",
        choices: [...availableCoinlibCurrencies, ...availableNativeCurrencies].map(ele => ({ title: currencies[ele].name, value: ele })),
        hint: '- Space to select. Return to submit'
    })

    const keagateConfig: Partial<MyConfig> = {};

    for (const currency of selectedCurrencies as AvailableCurrencies[]) {
        const currencyName = currencies[currency].name;

        const { publicKey, privateKey, shouldPrivateKey } = await prompts([
            {
                type: "text",
                name: "publicKey",
                message: `What's your ${currencyName} public key (where Keagate will send to)?`,
            },
            {
                type: "toggle",
                name: "shouldPrivateKey",
                message: `Would you like to be able to send ${currencyName} from your admin wallet via Keagate's API (requires private key)?`,
                initial: false,
                active: 'yes',
                inactive: 'no'
            },
            {
                type: prev => prev ? "text" : null,
                name: "privateKey",
                message:`What's your ${currencyName} private key?`,
            }
        ])
        keagateConfig[currency] = {
            ADMIN_PUBLIC_KEY: publicKey,
            ADMIN_PRIVATE_KEY: shouldPrivateKey ? privateKey : undefined
        }
    }

    return keagateConfig;
}
