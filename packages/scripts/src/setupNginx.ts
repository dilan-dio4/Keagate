import spawnAsync from '@expo/spawn-async';
import { MyConfig } from '@keagate/common';
import kleur from 'kleur';
import prompts from 'prompts';
import opts from './opts';
import logger from './DelegateLogger';

async function installNginx(): Promise<Partial<MyConfig>> {
    logger.log('Installing Nginx via Docker...');
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
                logger.debug('Docker container already exists. Trying to remove and re-install...')
                await spawnAsync('docker', 'stop keagate-nginx'.split(' '));
                await spawnAsync('docker', 'rm keagate-nginx'.split(' '));
                return installNginx();
            } else {
                logger.error(error)
                throw new Error(error);
            }
        }
    }
    logger.success();
    return {};
}


export default async function setupNginx(): Promise<Partial<MyConfig>> {
    const { nginxConfig } = await prompts({
        type: 'select',
        name: 'nginxConfig',
        message: 'Are you using a manual Nginx setup or would you like us to configure it for you?',
        choices: [
            { title: `Configure it for me ` + kleur.white().bold('(Recommended)'), value: 'INSTALL' },
            { title: `I'm using a manual setup for Keagate ` + kleur.white().bold('(Not recommended)'), value: 'MANUAL' }
        ],
        initial: 0,
    });


    if (nginxConfig === "INSTALL") {
        return installNginx();
    } else if (nginxConfig === "MANUAL") {
        return {}
    } else {
        return setupNginx();
    }

}