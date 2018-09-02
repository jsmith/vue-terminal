<template>
  <window>
    <div class="content">
      <div class="terminal" ref="container">
        <code v-for="(line, index) in lines" :key="index">{{ line }}</code>
      </div>
      <div class="input-area">
        <span class="ps1">{{ ps1 }}</span>
        <div class="input">
          <span class="arrow">➜ </span>
          <textarea title="input" rows="1" @keydown="keydown" autofocus/>
        </div>
      </div>
    </div>
  </window>
</template>

<script>
import { Abort, FileSystem, DIR } from '@/_'
import Window from '@/components/Window'
import program from '@/commands'

const fs = FileSystem.make({
  home: {
    jacob: {
      git: {},
      Downloads: {},
      Desktop: {}
    }
  }
})

// eslint-disable-next-line
Array.prototype.last = function () {
  return this[this.length - 1]
}

export default {
  name: 'Terminal',
  components: { Window },
  props: {
    live: { type: Boolean, default: true },
    height: { type: Number, default: 400 },
    path: { type: String, required: true },
    user: { type: String, required: true }
  },
  data () {
    return {
      lines: [],
      fs: fs.travel(this.path),
      commands: null,
      filter: ''
    }
  },
  computed: {
    container () {
      return this.$refs.container
    },
    ps1 () {
      return `${this.user}@${this.fs.path()}`
    },
    children () {
      return Object.values(this.fs.children)
    },
    directories () {
      return this.children.filter(c => c.type === DIR)
    },
    options () {
      return this.directories.filter(d => d.name.startsWith(this.filter))
    }
  },
  methods: {
    keydown (e) {
      const allowed = [13, 9]
      if (allowed.includes(e.which)) e.preventDefault()
      if (e.which === 13) this.enter(e)
      else if (e.which === 9) this.tab(e)
    },
    enter (e) {
      let text = e.target.value
      e.target.value = ''

      this.lines.push(' ')
      this.lines.push(this.ps1)
      this.lines.push(`➜ ${text}`)

      text = text.split(' ').filter(s => s)
      let [ command, ...args ] = text
      if (!(command in this.commands)) {
        this.lines.push(`command not found: ${command}`)
        return
      }

      command = this.commands[command]

      try {
        command(args)
      } catch (e) {
        if (!(e instanceof Abort)) throw e
      }
    },
    tab (e) {
      let start = e.target.selectionStart - 1
      const text = e.target.value
      if (!(text[start].match(/\S/))) return

      const end = start + 1
      while (text[start].match(/\S/)) {
        start--
        if (start === -1) break
      }
      start++

      this.filter = text.substring(start, end)

      if (this.options.length === 1) {
        console.log(text.substring(0, start))
        console.log(this.options[0].name)
        console.log(text.substring(end, text.length))
        e.target.value = text.substr(0, start) + this.options[0].name + text.substr(end, text.length)
      }
    }
  },
  watch: {
    lines: {
      immediate: true,
      handler () {
        if (!this.live) {
          return
        }

        this.$nextTick(() => {
          if (!this.container || this.container.children.length === 0) {
            return
          }

          this.container.children[this.container.children.length - 1].scrollIntoView()
        })
      }
    }
  },
  mounted () {
    this.commands = program(this, this.fs, this.lines)
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
