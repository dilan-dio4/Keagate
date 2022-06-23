import { AvailableCurrencies } from "@snow/common/src/currencies";
import GenericAdminWallet from "./adminWallets/GenericAdminWallet";
import GenericTransactionalWallet from "./transactionalWallets/GenericTransactionalWallet";
import AdminDash from "./adminWallets/Dash";
import AdminLitecoin from "./adminWallets/Litecoin";
import AdminSolana from "./adminWallets/Solana";
import TransactionalSolana from "./transactionalWallets/Solana";

// https://stackoverflow.com/a/66702014
type ConcreteConstructor<T extends abstract new (...args: any) => any> =
  (T extends abstract new (...args: infer A) => infer R ? 
    new (...args: A) => R : never) & T;


const currenciesToWallets: Record<AvailableCurrencies, { Admin: ConcreteConstructor<typeof GenericAdminWallet>, Transactional: ConcreteConstructor<typeof GenericTransactionalWallet> }> = {
    "ltc": {
        Admin: AdminLitecoin,
        Transactional: null
    },
    "sol": {
        Admin: AdminSolana,
        Transactional: TransactionalSolana
    },
    "dash": {
        Admin: AdminDash,
        Transactional: null
    },
    "ada": {
        Admin: undefined,
        Transactional: undefined
    },
    "btc": {
        Admin: undefined,
        Transactional: undefined
    },
    "xrp": {
        Admin: undefined,
        Transactional: undefined
    }
}

export default currenciesToWallets;