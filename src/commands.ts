import { Abort } from '@/_'

const argparse = require('argparse')

export default (terminal: any) => {
  const write = (string: string) => {
    string.split('\n').map(s => terminal.lines.push(s))
  }

  const stdout = { write }
  const exit = () => {}
  (process as any).exit = (process as any).exit || exit

  const ls = argparse.ArgumentParser({ stream: stdout })
  ls.addArgument('dir', { nargs: '?', defaultValue: '.' })
  ls.addArgument('-l', { action: 'storeTrue' })

  let previous: string | null = null
  const cd = argparse.ArgumentParser({ stream: stdout })
  cd.addArgument('dir', { nargs: '?', defaultValue: '~' })

  const cat = argparse.ArgumentParser({ stream: stdout })
  cat.addArgument('dirs', { nargs: '+', defaultValue: '.' })

  const source = argparse.ArgumentParser({ stream: stdout })
  source.addArgument('dir')

  const travel = (path: string, { allowFile, allowDirectory }: any) => {
    const abort = (message: string) => {
      write(message)
      throw new Abort()
    }

    let fs
    try {
      fs = terminal.fs.travel(path, { previous, home: terminal.homePath })
    } catch (e) {
      abort(e.message)
    }

    if (!allowFile && fs.isFile()) abort(`Not a directory: ${path}`)
    else if (!allowDirectory && fs.isDirectory()) abort(`Is a directory: ${path}`)
    else return fs
  }

  return {
    ls: (args: any) => {
      args = ls.parseArgs(args)
      const fs = travel(args.dir, { allowDirectory: true })

      let text = ''
      if (args.l) {
        Object.values(fs.children).map((child: any) => {
          text += `drwxr-xr-x  4 ${terminal.user} ${terminal.user}    4096 Jun 27 08:53 ${child.name}\n`
        })
      } else {
        text = fs.childrenNames().join(' ')
      }

      write(text)
    },
    cd: (args: any) => {
      args = cd.parseArgs(args)
      previous = terminal.path
      const fs = travel(args.dir, { allowDirectory: true })
      terminal.fs = fs
    },
    cat: (args: any) => {
      args = cat.parseArgs(args)
      args.dirs.map((p: string) => {
        const file = travel(p, { allowFile: true })
        if (file) write(file.content)
      })
    },
    source: (args: any) => {
      args = source.parseArgs(args)
      const fs = travel(args.dir, { allowFile: true })
      fs.content.split('\n').map((command: any) => terminal.runCommand(command))
    },
    alias: (args: any) => {
      args = args.join(' ')
      const match = args.match(/([^=]+)="(.*)"/)
      terminal.allCommands[match[1]] = () => terminal.runCommand(match[2])
    },
    help: () => {
      write(Object.keys(terminal.allCommands).join(' '))
    },
    echo: (args: any) => {
      write(args.join(' '))
    },
    clear: () => {
      terminal.lines = []
      terminal.showWelcome = false
    }
  }
}
