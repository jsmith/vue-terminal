import { storiesOf } from '@storybook/vue'

import Terminal from '@/components/Terminal.vue'
import Window from '@/components/Window.vue'
import CircleButton from '@/components/CircleButton.vue'

const fs = {
  home: {
    jacob: {
      git: {},
      Downloads: {},
      Documents: {},
      folder1: {},
      folder2: {},
      Desktop: {},
      '.bashrc': 'alias ll="ls -l"\ncd ~',
      'random.file': 'github.com is great'
    }
  }
}

storiesOf(Terminal.name, module)
  .add('standard', () => ({
    components: { Terminal },
    template: `
              <div :style="style">
                <terminal user="jacob" :file-system="fs" welcome="This is the welcome text: https://github.com/jsmith"/>
              </div>
              `,
    data: () => ({
      style: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '30px'
      },
      fs
    })
  }))

storiesOf(Window.name, module)
  .add('standard', () => ({
    components: { Window },
    template: `<window/>`
  }))

storiesOf(CircleButton.name, module)
  .add('standard', () => ({
    components: { CircleButton },
    template: `<circle-button :radius="6" color="#ef3ef3" />`
  }))
