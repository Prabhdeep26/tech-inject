import path from 'node:path';
import { installComponent, OverwriteError } from './installer.js';
import { SecurityError } from './validator.js';

export interface CliArgs {
  slug?: string;
  targetDir?: string;
  token?: string;
  apiUrl?: string;
  force: boolean;
  dryRun: boolean;
  help: boolean;
  version: boolean;
}

export function parseArgs(rawArgs: string[]): CliArgs {
  const args: CliArgs = {
    force: false,
    dryRun: false,
    help: false,
    version: false,
  };

  const positional: string[] = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--version' || arg === '-v') {
      args.version = true;
    } else if (arg === '--force' || arg === '-f' || arg === '--overwrite') {
      args.force = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--token' || arg === '-t') {
      args.token = rawArgs[++i];
    } else if (arg.startsWith('--token=')) {
      args.token = arg.substring(8);
    } else if (arg === '--api-url' || arg === '-u') {
      args.apiUrl = rawArgs[++i];
    } else if (arg.startsWith('--api-url=')) {
      args.apiUrl = arg.substring(10);
    } else if (!arg.startsWith('-')) {
      // Filter out redundant command verbs like 'add' or 'install'
      if (positional.length === 0 && (arg === 'add' || arg === 'install')) {
        continue;
      }
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    args.slug = positional[0];
  }
  if (positional.length > 1) {
    args.targetDir = positional[1];
  }

  return args;
}

export function printHelp(): void {
  console.log(`
tech-inject CLI - Component Installer & Bundle Extraction

USAGE:
  $ npx @tech-inject/installer <slug> [target-directory] [options]
  $ tech-inject add <slug> [target-directory] [options]

ARGUMENTS:
  <slug>                The component slug (e.g. "action-button" or "@tech-inject/action-button")
  [target-directory]    Destination directory (default: "./components/ui" or current working directory)

OPTIONS:
  -t, --token <token>   Authentication token for premium or protected components (or set TECH_INJECT_TOKEN)
  -u, --api-url <url>   Tech-Inject API base URL (default: process.env.TECH_INJECT_API_URL or http://localhost:3000)
  -f, --force           Overwrite existing destination files if they already exist
      --dry-run         Simulate installation without writing any files to disk
  -h, --help            Show this help documentation
  -v, --version         Print CLI version

SECURITY GUARANTEES:
  ✓ Path traversal protection: refuses to write outside the specified target directory
  ✓ Overwrite protection: refuses to silently replace existing files without --force
  ✓ Zero execution: never executes arbitrary shell commands or scripts from bundles
`);
}

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return 0;
  }

  if (args.version) {
    console.log('0.1.0');
    return 0;
  }

  if (!args.slug) {
    console.error('Error: Missing required component slug.');
    console.error('Usage: tech-inject <slug> [target-directory] [options]');
    console.error('Run "tech-inject --help" for detailed usage.');
    return 1;
  }

  const targetDir = args.targetDir || './src/components/ui';

  try {
    console.log(`[tech-inject] Fetching component "${args.slug}"...`);

    const result = await installComponent({
      slug: args.slug,
      targetDir,
      apiUrl: args.apiUrl,
      token: args.token,
      force: args.force,
      dryRun: args.dryRun,
    });

    if (args.dryRun) {
      console.log(`\n[tech-inject] [DRY RUN] Would install ${result.writtenFiles.length} file(s) into "${result.targetDir}":`);
      for (const f of result.writtenFiles) {
        console.log(`  + ${path.relative(process.cwd(), f)}`);
      }
      return 0;
    }

    console.log(`\n✓ Successfully installed "${args.slug}" into "${path.relative(process.cwd(), result.targetDir)}":`);
    for (const f of result.writtenFiles) {
      console.log(`  + ${path.relative(process.cwd(), f)}`);
    }
    return 0;
  } catch (err: any) {
    if (err instanceof OverwriteError) {
      console.error(`\n✖ ${err.message}`);
      return 2;
    }

    if (err instanceof SecurityError) {
      console.error(`\n🚨 SECURITY ERROR: ${err.message}`);
      return 3;
    }

    console.error(`\n✖ Error: ${err.message || err}`);
    return 1;
  }
}
