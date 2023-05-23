import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withRouterConfig } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AppComponent } from '@app/app.component';
import { MenuItemsService } from '@app/core';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { marked } from 'marked';
import { environment } from './environments/environment';

import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';
import { routes } from '@app/app.routes';

if (environment.production) {
  enableProdMode();
}

marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: (code, lang) => {
    const grammar = Prism.languages[lang];
    if (grammar) {
      return Prism.highlight(code, grammar, lang);
    }
    return code;
  },
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: (menu: MenuItemsService) => () => menu.load(),
      deps: [MenuItemsService],
      multi: true,
    },
    importProvidersFrom(HttpClientModule, IonicModule.forRoot({})),
    provideRouter(
      routes,
      withRouterConfig({
        paramsInheritanceStrategy: 'always',
      })
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
