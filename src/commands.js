import { Abort } from '@/_'

const argparse = require('argparse')

export default (terminal) => {
  const write = string => {
    string.split('\n').map(s => terminal.lines.push(s))
  }

  const stdout = { write }
  const exit = () => {}
  process.exit = process.exit || exit

  const ls = argparse.ArgumentParser({ stream: stdout })
  ls.addArgument('dir', { nargs: '?', defaultValue: '.' })
  ls.addArgument('-l', { action: 'storeTrue' })

  let previous = null
  const cd = argparse.ArgumentParser({ stream: stdout })
  cd.addArgument('dir', { nargs: '?', defaultValue: '~' })

  const cat = argparse.ArgumentParser({ stream: stdout })
  cat.addArgument('dirs', { nargs: '+', defaultValue: '.' })

  const source = argparse.ArgumentParser({ stream: stdout })
  source.addArgument('dir')

  const travel = (path, { allowFile, allowDirectory }) => {
    const abort = message => {
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
    ls: (args) => {
      args = ls.parseArgs(args)
      const fs = travel(args.dir, { allowDirectory: true })

      let text = ''
      if (args.l) {
        Object.values(fs.children).map(child => {
          text += `drwxr-xr-x  4 ${terminal.user} ${terminal.user}    4096 Jun 27 08:53 ${child.name}\n`
        })
      } else {
        text = fs.childrenNames().join(' ')
      }

      write(text, { allowDirectory: true })
    },
    cd: (args) => {
      args = cd.parseArgs(args)
      previous = terminal.path
      const fs = travel(args.dir, { allowDirectory: true })
      terminal.fs = fs
    },
    cat: args => {
      args = cat.parseArgs(args)
      args.dirs.map(p => {
        const file = travel(p, { allowFile: true })
        if (file) write(file.content)
      })
    },
    source: args => {
      args = source.parseArgs(args)
      const fs = travel(args.dir, { allowFile: true })
      fs.content.split('\n').map(command => terminal.runCommand(command))
    },
    alias: args => {
      args = args.join(' ')
      const match = args.match(/(?<key>[^=]+)="(?<value>.*)"/)
      terminal.allCommands[match.groups.key] = () => terminal.runCommand(match.groups.value)
    },
    help: () => {
      write(Object.keys(terminal.allCommands).join(' '))
    },
    echo: args => {
      write(args.join(' '))
    },
    clear: () => {
      terminal.lines = []
      terminal.showWelcome = false
    }
  }
}
