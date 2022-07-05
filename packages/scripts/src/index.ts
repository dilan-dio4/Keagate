import { program } from 'commander';

program
    .name('Keagate installer')
    .description('CLI for installing keagate')
    .option('-q, --quiet', 'Install quietly without asking for configuration. Sensible defaults will be applied')

async function main() {
    program.parse();

    process.exit();
}

require.main && main();