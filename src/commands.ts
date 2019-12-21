import { Abort, FileSystem } from '@/_';
import argparse from 'argparse';
import { Ref } from '@vue/composition-api';

type Command = () => void;

interface Options {
  lines: Ref<string[]>;
  homePath: Ref<string>;
  user: Ref<string>;
  fs: Ref<FileSystem>;
  path: Ref<string>;
  showWelcome: Ref<boolean>;
  allCommands: Ref<{ [k: string]: Command }>;
  runCommand: (command: string) => void;
}

interface Optional { type: '?'; default?: string; }
interface One { type: '1'; }
interface Plus { type: '+'; default?: string; }
interface Flag { type: 'flag'; }
type CommandOptions = Optional | Flag | Plus | One;
type CreateArg<T extends CommandOptions> =
  T extends Optional ? string | T['default'] :
  T extends Flag ? boolean :
  T extends One ? [string] :
  T extends Plus ? string[] :
  unknown;
type CreateArgs<T extends {  [k: string]: CommandOptions }> = { [K in keyof T]: CreateArg<T[K]> };

// Ok, so a good question is why we have this flag.
// Currently, our arg parser tries to exist the program using process.exit when it fails to parse.
// This is fine for most applications but we need to handle this in our web terminal.
// So, you see below we override process.exit which will be called when the parsing fails (or when --help/-h is used).
// We set disabled to false at the start of a command and then true when process.exit is called.
// When process.exit is called we need to know to start writing to the terminal (as the parser will continue as it did.
// not actually exit as it expected to when it called process.exit) and to not run the command (again, the parser did
// not stop when it expected to stop when it called process.exit).
let disabled = true;
const createWrite = (lines: Ref<string[]>) => (str: string) => {
  if (!disabled) {
    str.split('\n').map((s) => lines.value.push(s));
  }
};

// This is just a helper function with some nice typing :)
const createCommand = <T extends { [k: string]: CommandOptions}>(
  name: string,
  argumentDefinitions: T,
  callback: (args: CreateArgs<T>) => void,
  opts?: { stream: { write: (str: string) => void } },
) => {
  const command = argparse.ArgumentParser({ ...opts, addHelp: true, prog: name });
  Object.entries(argumentDefinitions).forEach(([argName, argDefinition]) => {
    if (argDefinition.type === 'flag') {
      command.addArgument(`-${argName}`, { action: 'storeTrue' });
    } else if (argDefinition.type === '?') {
      command.addArgument(argName, { nargs: '?', defaultValue: argDefinition.default });
    } else if (argDefinition.type === '+') {
      command.addArgument(argName, { nargs: '+', defaultValue: argDefinition.default });
    } else if (argDefinition.type === '1') {
      command.addArgument(argName, { nargs: 1 });
    }
  });

  return (argString: string[]) => {
    disabled = false;
    const args = command.parseArgs(argString);
    if (!disabled) {
      callback(args);
    }
  };
};

export default (terminal: Options) => {
  const write = createWrite(terminal.lines);
  const stdout = { write };
  const exit = () => {
    disabled = true;
  };

  (process as any).exit = exit;

  const ls = createCommand(
    'ls',
    {
      dir: { type: '?', default: '.' },
      l: { type: 'flag' },
    },
    (args) => {
      const fs = travel(args.dir, { allowDirectory: true });

      let text = '';
      if (args.l) {
        Object.values(fs.children).map((child: any) => {
          text += `drwxr-xr-x  4 ${terminal.user.value} ${terminal.user.value}    4096 Jun 27 08:53 ${child.name}\n`;
        });
      } else {
        text = fs.childrenNames().join(' ');
      }

      write(text);
    },
    { stream: stdout },
  );

  let previous: string | undefined;
  const cd = createCommand(
    'cd',
    { dir: { type: '?', default: '~' } },
    (args) => {
      if (args.dir === '-' && previous) {
        const temp = terminal.path.value;
        terminal.fs.value = travel(previous, { allowDirectory: true });
        previous = temp;
      } else {
        terminal.fs.value = travel(args.dir, { allowDirectory: true });
        previous = args.dir;
      }
    },
    { stream: stdout },
  );

  const cat = createCommand(
    'cat',
    { dirs: { type: '+' } },
    (args) => {
      args.dirs.map((p: string) => {
        const file = travel(p, { allowFile: true });
        if (file) { write(file.content); }
      });
    },
    { stream: stdout },
  );

  const source = createCommand(
    'source',
    { dir: { type: '1' } },
    (args) => {
      const fs = travel(args.dir[0], { allowFile: true });
      fs.content.split('\n').map((command) => terminal.runCommand(command));
    },
  );

  const travel = (path: string, { allowFile, allowDirectory }: any) => {
    let fs: FileSystem | undefined;
    try {
      fs = terminal.fs.value.travel(path, { previous, home: terminal.homePath.value });
    } catch (e) {
      write(e.message);
      throw new Abort();
    }

    if (!allowFile && fs.isFile()) {
      write(`Not a directory: ${path}`);
      throw new Abort();
    } else if (!allowDirectory && fs.isDirectory()) {
      write(`Is a directory: ${path}`);
      throw new Abort();
    } else {
      return fs;
    }
  };

  return {
    ls,
    cd,
    cat,
    source,
    alias: (args: string[]) => {
      const argsString = args.join(' ');
      const match = argsString.match(/([^=]+)="(.*)"/) as [string, string, string];
      if (!match) {
        write('Unable to parse alias command.');
        throw new Abort();
      }
      terminal.allCommands.value[match[1]] = () => terminal.runCommand(match[2]);
    },
    help: () => {
      write(Object.keys(terminal.allCommands.value).join(' '));
    },
    echo: (args: string[]) => {
      write(args.join(' '));
    },
    clear: () => {
      terminal.lines.value = [];
      terminal.showWelcome.value = false;
    },
  };
};
