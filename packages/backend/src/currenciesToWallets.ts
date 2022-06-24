import { AvailableCurrencies, ConcreteConstructor } from "@snow/common/src";
import GenericAdminWallet from "./adminWallets/GenericAdminWallet";
import GenericTransactionalWallet from "./transactionalWallets/GenericTransactionalWallet";
import AdminDash from "./adminWallets/Dash";
import AdminLitecoin from "./adminWallets/Litecoin";
import AdminSolana from "./adminWallets/Solana";
import TransactionalSolana from "./transactionalWallets/Solana";
import TransactionalDash from './transactionalWallets/Dash';
import TransactionalLitecoin from "./transactionalWallets/Litecoin";

const currenciesToWallets: Record<AvailableCurrencies, { Admin: ConcreteConstructor<typeof GenericAdminWallet>, Transactional: ConcreteConstructor<typeof GenericTransactionalWallet> }> = {
    "ltc": {
        Admin: AdminLitecoin,
        Transactional: TransactionalLitecoin
    },
    "sol": {
        Admin: AdminSolana,
        Transactional: TransactionalSolana
    },
    "dash": {
        Admin: AdminDash,
        Transactional: TransactionalDash
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