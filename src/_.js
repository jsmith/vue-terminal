export const shadeColor = (color, percent) => {
  const f = parseInt(color.slice(1), 16)
  const t = percent < 0 ? 0 : 255
  const p = percent < 0 ? percent * -1 : percent
  const R = f >> 16
  const G = f >> 8 & 0x00FF
  const B = f & 0x0000FF
  return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1)
}

export class FileSystem {
  constructor (name, type, parent, children = {}) {
    this.name = name
    this.type = type
    this.parent = parent
    this.children = children // for directories
    this.content = '' // for files
  }
  _travel (item, previous) {
    if (item === '-') {
      if (previous) {
        return this.travel(previous)
      } else {
        return this
      }
    } else if (item === '..') {
      return this.parent ? this.parent : this
    } else if (item === '' || item === '.') {
      return this
    } else if (item in this.children) {
      return this.children[item]
    } else {
      return null
    }
  }
  travel (travelPath, opts = {}) {
    const { previous, home } = opts
    if (travelPath.startsWith('~')) travelPath = home + travelPath.substring(1, travelPath.length)

    let fs = this
    if (travelPath.startsWith('/')) fs = FileSystem.toRoot(fs)
    const parts = travelPath.split('/')
    parts.map((item, i) => {
      fs = fs._travel(item, previous)
      if (!fs) throw Error(`No such file or directory: ${travelPath}`)
      if (i !== parts.length - 1 && !fs.isDirectory()) throw new Error(`Not a directory: ${travelPath}`)
    })
    return fs
  }
  static toRoot (fs) {
    while (fs.parent) fs = fs.parent
    return fs
  }
  childrenNames () {
    if (this.isDirectory()) return Object.keys(this.children)
    else return null
  }
  isDirectory () { return this.type === DIR }
  isFile () { return this.type === FILE }
  static make (o) {
    const make = (o, parent) => {
      parent.children = {}
      Object.keys(o).map(name => {
        if (o[name].constructor === String) {
          parent.children[name] = new FileSystem(name, FILE, parent)
          parent.children[name].content = o[name]
        } else {
          parent.children[name] = make(o[name], new FileSystem(name, DIR, parent))
        }
      })
      return parent
    }

    return make(o, new FileSystem(null, DIR, null))
  }
  path () {
    let fs = this
    const parents = []
    while (fs.name !== null) {
      parents.push(fs.name)
      fs = fs.parent
    }
    return '/' + parents.reverse().join('/')
  }
  touch (name, ignoreExists = false) {
    if (this.isFile()) throw new Error()
    else if (name in this.children) {
      if (!ignoreExists) throw new Error()
    } else this.children[name] = new FileSystem(name, FILE, this)
  }
  append (text) {
    if (!this.isFile()) throw new Error()
    this.content += text + '\n'
  }
  copy (name) {
    return new FileSystem(name || this.name, this.type, this.parent, this.children)
  }
  displayName () {
    return this.isFile() ? this.name : this.name + '/'
  }
}

export const DIR = 'directory'
export const FILE = 'file'
export class Abort {}
