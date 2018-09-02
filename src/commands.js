import { Abort } from '@/_'
const argparse = require('argparse')

export default (terminal) => {
  process.exit = () => {}
  process.stdout = {
    write (string) {
      string.split('\n').map(s => terminal.lines.push(s))
    }
  }

  const ls = argparse.ArgumentParser()
  ls.addArgument('dir', { nargs: '?', defaultValue: '.' })

  const cd = argparse.ArgumentParser()
  cd.addArgument('dir', { nargs: '?', defaultValue: '~' })

  const travel = (path) => {
    const fs = terminal.fs.travel(path)
    if (!fs) {
      process.stdout.write(`cannot access '${path}': No such file or directory`)
      throw new Abort()
    }

    return fs
  }

  return {
    ls: (args) => {
      args = ls.parseArgs(args)
      process.stdout.write(travel(args.dir).childrenNames().join(' '))
    },
    cd: (args) => {
      args = cd.parseArgs(args)
      terminal.fs = travel(args.dir)
    }
  }
}
