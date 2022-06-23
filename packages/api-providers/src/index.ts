import NowNodesProvider from './NowNodesProvider';
import SoChainProvider from './SoChainProvider';
import TatumProvider from './TatumProvider';
import GenericProvider from './GenericProvider';

export type AvailableProviders = "NowNodes" | "Tatum";

// https://stackoverflow.com/a/66702014
type ConcreteConstructor<T extends abstract new (...args: any) => any> =
  (T extends abstract new (...args: infer A) => infer R ? 
    new (...args: A) => R : never) & T;


const idsToProviders: Record<AvailableProviders, ConcreteConstructor<typeof GenericProvider>> = {
    Tatum: TatumProvider,
    NowNodes: NowNodesProvider
}

export default idsToProviders;
export { 
    NowNodesProvider,
    SoChainProvider,
    TatumProvider,
    GenericProvider
};