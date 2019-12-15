declare module '@storybook/vue' {
  export function storiesOf(name: string, mod: NodeModule): {
    add: (name: string, config: () => any) => void
  };
}

declare module 'vue-perfect-scrollbar' {
  import Vue from 'vue';
  export default Vue;
}

declare module 'linkifyjs/html' {
  export default function(text: string, opts?: { defaultProtocol?: 'http' | 'https' }): void;
}

declare module 'path' {
  const path: {
    join(arg: string, ...args: string[]): void;
    sep: string;
  };

  export default path;
}

declare module 'argparse' {
  const ex: {
    ArgumentParser: (opts: any) => {
      addArgument(name: string, opts?: any): void,
      parseArgs(args: string[]): any;
    },
  }

  export default ex;
}