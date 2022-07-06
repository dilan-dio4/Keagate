import spawnAsync from '@expo/spawn-async';

export default async function setupNginx(): Promise<void> {
    await spawnAsync('docker', "run -d --network host --name keagate-nginx nginx:mainline -v $HOME/Keagate/packages/scripts/assets/default.conf:/etc/nginx/conf.d/default.conf".split(" "));
}
