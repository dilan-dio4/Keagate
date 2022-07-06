import spawnAsync from '@expo/spawn-async';
import { MyConfig } from '@keagate/common';
import opts from './opts';

export default async function setupNginx(): Promise<Partial<MyConfig>> {
    if (!opts().dryrun) {
        await spawnAsync('docker', "run -d --network host --name keagate-nginx -v $HOME/Keagate/packages/scripts/assets/default.conf:/etc/nginx/conf.d/default.conf nginx:mainline".split(" "));
    }
    return {};
}
