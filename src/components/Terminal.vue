<template>
  <window>
    <div class="content" ref="content">
      <div v-if="showWelcome">
        <code v-if="welcome">{{ welcome | strip }}</code>
        <code v-if="welcome">{{ ' ' }}</code>
        <code>Type <strong>help</strong> to list the available commands</code>
      </div>
      <div class="terminal" ref="container">
        <code v-for="(line, index) in lines" :key="index">{{ line }}</code>
      </div>
      <div class="input-area">
        <span class="ps1">{{ ps1 }}</span>
        <div class="input">
          <span class="arrow">➜ </span>
          <textarea title="input" rows="1" spellcheck="false" v-model="text" @keydown="keydown" @keydown.ctrl.67="pushLines" autofocus/>
        </div>
        <code v-if="help">{{ help }}</code>
      </div>
    </div>
  </window>
</template>

<script>
import path from 'path'
import { Abort, FileSystem } from '@/_'
import Window from '@/components/Window'
import program from '@/commands'

export default {
  name: 'Terminal',
  components: { Window },
  props: {
    live: { type: Boolean, default: true },
    height: { type: Number, default: 400 },
    defaultPath: { type: String, required: false },
    user: { type: String, required: true },
    hostname: { type: String, default: 'computer' },
    welcome: String,
    commands: { type: Object, default: () => ({}) },
    fileSystem: { type: Object, required: true }
  },
  data () {
    return {
      lines: [],
      fs: FileSystem.make(this.fileSystem),
      allCommands: null,
      filter: '',
      history: [],
      position: 0,
      text: '',
      saved: '',
      tempHistory: [],
      help: '',
      showWelcome: true
    }
  },
  computed: {
    container () {
      return this.$refs.container
    },
    content () {
      return this.$refs.content
    },
    ps1 () {
      return `${this.user}@${this.hostname}:${this.path}`
    },
    tempFs () {
      try { return this.fs.travel(this.filterDirname, { home: this.homePath }) } catch (e) { return null }
    },
    children () {
      return this.tempFs ? Object.values(this.tempFs.children) : []
    },
    options () {
      return this.children.filter(d => d.name.startsWith(this.filterBasename))
    },
    path () {
      return this.fs.path().replace(this.homePath, '~')
    },
    homePath () {
      return '/' + path.join('home', this.user)
    },
    historyIndex () {
      return this.history.length - 1 - this.position
    },
    home () {
      return this.fs.travel(this.homePath)
    },
    bashHistory () {
      return this.home.travel('.bash_history')
    },
    filterBreakpoint () {
      const end = this.filter.length
      let start = end - 1
      while (start >= 0 && this.filter[start] !== '/') start--
      return start
    },
    filterDirname () {
      return this.filter.substring(0, this.filterBreakpoint) || '.'
    },
    filterBasename () {
      return this.filter.substring(this.filterBreakpoint + 1, this.filter.length)
    }
  },
  methods: {
    keydown (e) {
      const allowed = [13, 9, 38, 40]
      if (allowed.includes(e.which)) e.preventDefault()
      if (e.which === 13) this.enter(e)
      else if (e.which === 9) this.tab(e)
      else if (e.which === 38) this.previous(e) // up
      else if (e.which === 40) this.next(e) // down
    },
    pushLines () {
      this.lines.push(' ')
      this.lines.push(this.ps1)
      this.lines.push(`➜ ${this.text}`)
      const text = this.text
      this.position = 0
      this.text = ''
      this.saved = ''
      this.help = ''
      this.tempHistory = [...this.history]
      return text
    },
    previous () {
      if (this.position < this.tempHistory.length) {
        this.position++
        this.text = this.tempHistory[this.historyIndex + 1]
      }
    },
    next () {
      if (this.position === 1) {
        this.text = this.saved
        this.position--
      } else if (this.position > 1) {
        this.text = this.tempHistory[this.historyIndex + 2]
        this.position--
      }
    },
    enter () {
      const text = this.pushLines()
      this.history.push(text)
      this.runCommand(text)
    },
    tab (e) {
      if (this.text.length === 0) return

      let start = e.target.selectionStart - 1
      const end = start + 1
      while (start >= 0 && this.text[start].match(/\S/)) start--
      start++

      this.filter = this.text.substring(start, end)

      console.log(this.tempFs, this.options)
      if (this.options.length !== 1) {
        this.help = this.options.map(o => o.displayName()).join(' ')
        return
      }

      // noinspection JSPotentiallyInvalidTargetOfIndexedPropertyAccess
      const replacement = path.join(this.filterDirname, this.options[0].displayName())

      this.help = ''
      this.text = this.text.substring(0, start) + replacement + this.text.substring(end, this.text.length)
    },
    runCommand (text) {
      if (!text) return
      const parts = text.split(' ').filter(s => s)
      let [ command, ...args ] = parts
      if (!(command in this.allCommands)) {
        this.lines.push(`command not found: ${command}`)
        return
      }

      try {
        this.allCommands[command](args)
      } catch (e) {
        if (!(e instanceof Abort)) throw e
      }
    },
    scrollIntoView (el) {
      this.$nextTick(() => {
        if (!el || el.children.length === 0) {
          return
        }

        const last = el.children[el.children.length - 1]
        if (last.scrollIntoView) last.scrollIntoView()
      })
    }
  },
  filters: {
    strip (text) {
      return text.trim()
    }
  },
  watch: {
    lines: {
      immediate: true,
      handler () {
        if (!this.live) return
        this.scrollIntoView(this.$refs.content)
      }
    },
    text () {
      if (this.position === 0) {
        this.saved = this.text
      } else {
        this.$set(this.tempHistory, this.historyIndex + 1, this.text)
      }
    },
    history () {
      this.tempHistory = [...this.history]
      this.bashHistory.append(this.history[this.history.length - 1])
    },
    help () {
      this.scrollIntoView(this.$refs.content)
    }
  },
  mounted () {
    this.allCommands = program(this)
    this.allCommands.source(['~/.bashrc'])
    this.home.touch('.bash_history', true)
  }
}
</script>

<style scoped lang="stylus">
color = aliceblue
font-family = monospace
font-size = 13px

text-format()
  color color
  font-family font-family
  font-size font-size

code
  float: left
  clear: both
  white-space: pre
  background-color: unset
  color: unset
  box-shadow: unset
  text-align left

.terminal
  padding: 0 10px 0 0
  display: inline-block
  float: left

.content
  text-format()
  display flex
  flex-direction column
  padding-left: 4px

.cursor
  font-weight: 100
  color: #2E3D48
  font-size: 15px
  animation: 1s blink step-end infinite

textarea
  background: transparent
  border: none
  flex-grow 1
  outline none
  text-format()
  padding 0
  resize none

.ps1, .arrow
  white-space pre

.arrow
  display block

.input-area
  padding 15px 0
  text-align: left

.input
  display flex

@keyframes blink
  from, to
    color: transparent

  50%
    color: white
</style>
