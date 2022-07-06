import spawnAsync from '@expo/spawn-async';
import { MyConfig } from '@keagate/common/src';

export default async function setupNginx(): Promise<Partial<MyConfig>> {
    await spawnAsync('docker', "run -d --network host --name keagate-nginx nginx:mainline -v $HOME/Keagate/packages/scripts/assets/default.conf:/etc/nginx/conf.d/default.conf".split(" "));
    return {};
}
