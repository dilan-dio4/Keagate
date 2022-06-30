import NowNodesProvider from './NowNodesProvider';
import SoChainProvider from './SoChainProvider';
import TatumProvider from './TatumProvider';
import GenericProvider from './GenericProvider';
import { ConcreteConstructor } from '@keagate/common/src';

export type AvailableProviders = 'NowNodes' | 'Tatum';

const idsToProviders: Record<AvailableProviders, ConcreteConstructor<typeof GenericProvider>> = {
    Tatum: TatumProvider,
    NowNodes: NowNodesProvider,
};

export default idsToProviders;
export { NowNodesProvider, SoChainProvider, TatumProvider, GenericProvider };
