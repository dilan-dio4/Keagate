import spawnAsync from '@expo/spawn-async';
import { MyConfig } from '@keagate/common';
import opts from './opts';

export default async function setupNginx(): Promise<Partial<MyConfig>> {
    if (!opts().dryrun) {
        try {
            await spawnAsync(
                'docker',
                `run -d --network host --name keagate-nginx -v ${
                    process.env.HOME || '~'
                }/Keagate/packages/scripts/assets/default.conf:/etc/nginx/conf.d/default.conf nginx:mainline`.split(' '),
            );
        } catch (error) {
            if (error.output && error.output[1].startsWith('docker: Error response from daemon: Conflict. The container name')) {
                await spawnAsync('docker', 'stop keagate-nginx'.split(' '));
                await spawnAsync('docker', 'rm keagate-nginx'.split(' '));
                return setupNginx();
            } else {
                throw new Error(error);
            }
        }
    }
    return {};
}
