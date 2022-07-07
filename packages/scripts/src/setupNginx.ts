import spawnAsync from '@expo/spawn-async';
import { MyConfig, fGet } from '@keagate/common';
import kleur from 'kleur';
import prompts from 'prompts';
import opts from './opts';
import logger from './DelegateLogger';

async function _installNginx(dockerString: string, host: string): Promise<Partial<MyConfig>> {
    logger.log('Installing Nginx via Docker...');
    if (!opts().dryrun) {
        try {
            await spawnAsync(
                'docker',
                dockerString.split(' '),
            );
        } catch (error) {
            if (error.output && error.output[1].startsWith('docker: Error response from daemon: Conflict. The container name')) {
                logger.debug('Docker container already exists. Trying to remove and re-install...')
                await spawnAsync('docker', 'stop keagate-nginx'.split(' '));
                await spawnAsync('docker', 'rm keagate-nginx'.split(' '));
                return _installNginx(dockerString, host);
            } else {
                logger.error(error)
                throw new Error(error);
            }
        }
    }
    logger.success();
    return { HOST: host };
}

async function installNginxNoSSL(): Promise<Partial<MyConfig>> {
    const { ip } = await fGet("https://api.ipify.org?format=json")
    return await _installNginx(
        `run ` +
        `-d ` +
        `--network host ` +
        `--name keagate-nginx ` +
        `--restart on-failure ` +
        `-v ${process.env.HOME || '~'}/Keagate/packages/scripts/assets/default.conf:/etc/nginx/conf.d/default.conf ` + 
        `nginx:mainline `,
        "http://" + ip
    )
}

async function installNginxWithSSL(SSLDomains: string): Promise<Partial<MyConfig>> {
    // https://github.com/Valian/docker-nginx-auto-ssl
    // https://github.com/Valian/docker-nginx-auto-ssl/blob/master/snippets/server-proxy.conf
    return await _installNginx(
        `run ` +
        `-d ` +
        `--network host ` +
        `--name keagate-nginx ` +
        `--restart on-failure ` +
        `-e ALLOWED_DOMAINS="${SSLDomains}" ` + 
        `-e SITES="${SSLDomains}=localhost:8081" ` + 
        `valian/docker-nginx-auto-ssl `,
        "https://" + SSLDomains
    )
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
        const { SSLWanted, SSLDomains } = await prompts([
            {
                type: 'toggle',
                name: 'SSLWanted',
                message: 'Do you want to enable SSL (a valid domain name must be pointing to this machine)?',
                initial: false,
                active: 'yes',
                inactive: 'no'
            },
            {
                type: prev => (prev ? 'text' : null),
                name: 'SSLDomains',
                message: 'What is your domain name (e.g. (www|api).example.com or example.com)?',
                validate: val => val.length > 0 ? true : "An input is required. Please try again."
            }
        ])
        if (SSLWanted) {
            return installNginxWithSSL(SSLDomains);
        } else {
            return installNginxNoSSL();
        }
    } else if (nginxConfig === "MANUAL") {
        return {}
    } else {
        return setupNginx();
    }

}