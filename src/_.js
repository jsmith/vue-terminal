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
  constructor (name, type, parent, children) {
    this.name = name
    this.type = type
    this.parent = parent
    this.children = children
  }
  _travel (item) {
    if (item === '..') {
      return this.parent ? this.parent : this
    } else if (item === '.' || item === '') {
      return this
    } else if (item in this.children && this.children[item].isDirectory()) {
      return this.children[item]
    } else {
      return null
    }
  }
  travel (travelPath) {
    let fs = this
    travelPath.split('/').map(item => {
      fs = fs._travel(item)
    })
    return fs
  }
  childrenNames () {
    if (this.isDirectory()) return Object.keys(this.children)
    else return null
  }
  isDirectory () { return this.type === DIR }
  static make (o) {
    const make = (o, parent) => {
      parent.children = {}
      Object.keys(o).map(name => {
        if (o[name].constructor === String) {
          parent.children[name] = new FileSystem(name, FILE, parent)
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
    while (fs !== null) {
      parents.push(fs.name)
      fs = fs.parent
    }
    return parents.reverse().join('/')
  }
}

export const DIR = 'directory'
export const FILE = 'directory'

export class Abort extends Error {}
