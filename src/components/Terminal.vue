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
          <textarea title="" rows="1" @keypress="keypress" autofocus/>
        </div>
      </div>
    </div>
  </window>
</template>

<script>
import Window from '@/components/Window'

const commands = {
  ls: (directory, lines) => {
    lines.push(Object.keys(directory).join(' '))
  }
}

const folders = {
  git: {},
  Downloads: {},
  Desktop: {}
}

const lines = Array(26).fill(0).map((i, j) => `THIS is LINE: ${i}:${j}`)

export default {
  name: 'Terminal',
  components: { Window },
  props: {
    live: { type: Boolean, default: true },
    height: { type: Number, default: 400 },
    path: { type: String, required: true },
    user: { type: String, required: true }
  },
  data: () => ({ lines }),
  computed: {
    container () {
      return this.$refs.container
    },
    ps1 () {
      return `${this.user}@${this.path}`
    }
  },
  methods: {
    keypress (e) {
      if (e.which !== 13) return // enter
      e.preventDefault()
      let text = e.target.value
      e.target.value = ''

      this.lines.push(' ')
      this.lines.push(this.ps1)
      this.lines.push(`➜ ${text}`)

      text = text.split(' ').filter(s => s)
      let [ command, ...args ] = text
      if (!(command in commands)) {
        this.lines.push(`command not found: ${command}`)
        console.log(this.lines.length)
        return
      }

      command = commands[command]
      command(folders, this.lines, ...args)
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

.ps1, .arrow
  white-space pre

.arrow
  display block

.input-area
  padding 10px 0
  text-align: left

.input
  display flex

@keyframes blink
  from, to
    color: transparent

  50%
    color: white
</style>
