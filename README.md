# vue-terminal
`vue-terminal` is a terminal emulator written in Vue. It is currently being used to power my [portfolio site](https://jsmith.github.io).

<a href="https://ibb.co/cmSQh0"><img src="https://preview.ibb.co/dK3y20/Screenshot-from-2018-11-16-08-08-13.png" alt="Screenshot-from-2018-11-16-08-08-13" border="0" /></a>

## Installation
Just install using npm!
```
npm install @jsmith21/vue-terminal
```

## Usage
Register the plugin:
```
import Vue from 'vue';
import plugin from '@jsmith21/vue-terminal';
Vue.use(plugin);
```

Define your file system object:
```
const fs = {
  home: {
    jacob: {
      'git': {},
      'Downloads': {},
      'Documents': {},
      'folder1': {},
      'folder2': {},
      'Desktop': {},
      '.bashrc': 'alias ll="ls -l"\ncd ~',
      'random.file': 'github.com is great',
    },
  },
};
```

Then, in your `Vue` template, pass in all of the props:
```
<terminal 
  user="jacob" 
  :file-system="fs" 
  welcome="This is the welcome text: https://github.com/jsmith"
></terminal>
```

See [stories.ts](/jsmith/vue-terminal/blob/master/src/stories.ts) for a working example using Storybook!

## Project setup
```
npm i
```

### Startup the Development Environment (Storybook)
```
npm run serve:storybook
```

### Publishing
```
VERSION="YOUR_VERSION"
npm run bundle
git add .
git commit -m "$VERSION"
git tag v$VERSION
git push
npm publish
```
