import { use } from 'react';

import { createI18nServerInstance } from './i18n.server';

type PageProps = {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export function withI18n<T extends Partial<PageProps>>(
  // Server pages may be async, which React.ComponentType doesn't allow.
  Component: (props: T) => React.ReactNode | Promise<React.ReactNode>,
) {
  return function PageWithI18n(props: T) {
     
    use(createI18nServerInstance());

    return <Component {...props} />;
  };
}

