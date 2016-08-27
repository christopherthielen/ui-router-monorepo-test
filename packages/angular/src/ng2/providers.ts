/**
 * # UI-Router for Angular 2
 *
 * For the quick start repository, please see http://github.com/ui-router/quickstart-ng2
 * 
 * Getting started:
 * 
 * - Use npm. Add a dependency on latest `ui-router-ng2`
 * - Import UI-Router classes directly from `"ui-router-ng2"`
 *
 * ```js
 * import {StateRegistry} from "ui-router-ng2";
 * ```
 *
 * - When defining a component, add the [[UIROUTER_DIRECTIVES]] to `directives:` array.
 * - Either bootstrap a [[UIView]] component, or add a `<ui-view></ui-view>` viewport to your root component.
 * - Create application states (as defined by [[Ng2StateDeclaration]]) which will fill in the viewports.
 * - Create a [[UIRouterConfig]], and register your states in the [[UIRouterConfig.configure]] function.
 *
 * ```js
 * import {UIRouter} from "ui-router-ng2";
 * import {INITIAL_STATES} from "./app.states";
 * @ Injectable()
 * export class MyUIRouterConfig {
 *   configure(uiRouter: UIRouter) {
 *     INITIAL_STATES.forEach(function(state) {
 *       uiRouter.stateRegistry.register(state));
 *     });
 *   }
 * }
 * ```
 *
 * - When bootstrapping: include the [[UIROUTER_PROVIDERS]] and define a provider for your [[UIRouterConfig]]
 *
 * ```js
 * import {provide} from "@angular/core";
 * import {bootstrap} from 'angular2/platform/browser';
 * import {UIRouterConfig, UIView, UIROUTER_PROVIDERS} from "ui-router-ng2";
 * import {MyUIRouterConfig} from "./router.config";
 *
 * bootstrap(UIView, [
 *     ...UIROUTER_PROVIDERS,
 *     provide(UIRouterConfig, { useClass: MyUIRouterConfig })
 * ]);
 * ```
 *
 * @preferred @module ng2
 */ /** */
import {Injector} from "@angular/core";
import {UIRouter} from "../router";
import {PathNode} from "../path/node";
import {StateRegistry} from "../state/stateRegistry";
import {StateService} from "../state/stateService";
import {TransitionService} from "../transition/transitionService";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";
import {UrlRouter} from "../url/urlRouter";
import {ViewService} from "../view/view";
import {UIView, ParentUIViewInject} from "./directives/uiView";
import {ng2ViewsBuilder, Ng2ViewConfig} from "./statebuilders/views";
import {Ng2ViewDeclaration, NG2_INJECTOR_TOKEN} from "./interface";
import {UIRouterConfig} from "./uiRouterConfig";
import {Globals} from "../globals";
import {UIRouterLocation} from "./location";
import {services} from "../common/coreservices";
import {ProviderLike} from "../state/interface";
import {Resolvable} from "../resolve/resolvable";
import {ngModuleResolvablesBuilder} from "./statebuilders/lazyLoadNgModuleResolvable";

let uiRouterFactory = (routerConfig: UIRouterConfig, location: UIRouterLocation, injector: Injector) => {
  services.$injector.get = injector.get.bind(injector);

  location.init();


  // ----------------- Create router -----------------
  // Create a new ng2 UIRouter and configure it for ng2
  let router = new UIRouter();
  let registry = router.stateRegistry;

  // ----------------- Configure for ng2 -------------
  // Apply ng2 ui-view handling code
  router.viewService.viewConfigFactory("ng2", (path: PathNode[], config: Ng2ViewDeclaration) => new Ng2ViewConfig(path, config));
  registry.decorator('views', ng2ViewsBuilder);

  // Apply statebuilder decorator for ng2 NgModule registration
  registry.stateQueue.flush(router.stateService);
  registry.decorator('resolvables', ngModuleResolvablesBuilder);

  router.stateRegistry.stateQueue.autoFlush(router.stateService);
  
  let ng2InjectorResolvable = new Resolvable(NG2_INJECTOR_TOKEN, () => injector, null, { when: "EAGER" }, injector);
  router.stateRegistry.root().resolvables.push(ng2InjectorResolvable);

  setTimeout(() => {
    routerConfig.configure(router);

    if (!router.urlRouterProvider.interceptDeferred) {
      router.urlRouter.listen();
      router.urlRouter.sync();
    }
  });

  return router;
};

/**
 * The UI-Router providers, for use in your application bootstrap
 *
 * @example
 * ```js
 *
 * bootstrap(UIView, [
 *     ...UIROUTER_PROVIDERS,
 *     ...HTTP_PROVIDERS,
 *     provide(UIRouterConfig, { useClass: MyUIRouterConfig })
 * ]);
 * ```
 */

export const UIROUTER_PROVIDERS: ProviderLike[] = [
  { provide: UIRouter, useFactory: uiRouterFactory, deps: [UIRouterConfig, UIRouterLocation, Injector] },

  { provide: UIRouterLocation, useClass: UIRouterLocation },

  { provide: StateService, useFactory: (r: UIRouter) => { return r.stateService; }, deps: [UIRouter]},

  { provide: TransitionService, useFactory: (r: UIRouter) => { return r.transitionService; }, deps: [UIRouter]},

  { provide: UrlMatcherFactory, useFactory: (r: UIRouter) => { return r.urlMatcherFactory; }, deps: [UIRouter]},

  { provide: UrlRouter, useFactory: (r: UIRouter) => { return r.urlRouter; }, deps: [UIRouter]},

  { provide: ViewService, useFactory: (r: UIRouter) => { return r.viewService; }, deps: [UIRouter]},

  { provide: StateRegistry, useFactory: (r: UIRouter) => { return r.stateRegistry; }, deps: [UIRouter]},

  { provide: Globals, useFactory: (r: UIRouter) => { return r.globals; }, deps: [UIRouter]},

  { provide: UIView.PARENT_INJECT, useFactory: (r: StateRegistry) => { return { fqn: null, context: r.root() } as ParentUIViewInject }, deps: [StateRegistry]}
];