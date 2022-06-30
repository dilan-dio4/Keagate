import { GenericProvider } from "@keagate/api-providers/src";
import GenericAdminWallet from "../GenericAdminWallet";

export default abstract class GenericNativeAdminWallet extends GenericAdminWallet {
    protected apiProvider: GenericProvider;
    public publicKey: string;
}