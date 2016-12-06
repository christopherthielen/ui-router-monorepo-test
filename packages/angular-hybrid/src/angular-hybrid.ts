import * as angular from 'angular';

import { $InjectorLike, Ng1ViewConfig, StateObject, StateProvider } from '@uirouter/angularjs';
import { Component, ElementRef, Inject, Injector, Input, NgModule } from '@angular/core';
import { downgradeComponent, UpgradeModule } from '@angular/upgrade/static';

import {
  _UIROUTER_SERVICE_PROVIDERS, applyModuleConfig, forEach, NATIVE_INJECTOR_TOKEN, ng2LazyLoadBuilder, Ng2ViewConfig,
  Ng2ViewDeclaration, ParentUIViewInject, PathNode, Resolvable, StateRegistry, StatesModule, UIRouter,
  UIROUTER_MODULE_TOKEN, UIROUTER_ROOT_MODULE, UIRouterModule, UIView, ViewConfig, ViewService
} from '@uirouter/angular';

import { UIRouterRx } from '@uirouter/rx';

/**
 * Create a ng1 module for the ng1 half of the hybrid application to depend on.
 *
 * Example:
 * let myApp = angular.module('myApp', ['ui.router.upgrade']);
 */
export let upgradeModule = angular.module('ui.router.upgrade', ['ui.router']);
export let ng1InitModule = angular.module('ui.router.init');

/**
 * UIViewNgUpgrade is a component bridge from ng1 ui-view to ng2 ui-view
 *
 * When a ui-router for ng1 is registering a state it checks if a view's
 * `component:` is an ng2 Component class. If so, it creates a special ng1 template
 * which references this component, i.e., <ui-view-ng-upgrade></ui-view-ng-upgrade>
 *
 * See that code by searching ng1-to-ng2 source for: "$stateProvider.decorator"
 *
 * ---
 *
 * ng1-to-ng2 component bridge process:
 *
 * 1)
 * When an ng1 template creates a ui-view which is targeted by a ng2 Component,
 *
 * ```
 * <a ui-sref="foo">Go to foo</a>
 * <div ui-view> <!-- ui-view created in ng1 template -->
 * </div> <!-- targeted with { component: Ng2RoutedComponent } -->
 * ```
 *
 * the state decorator spits out a custom template.  That template loads this
 * ng2 Component adapter as a downgraded-to-ng1 directive.
 *
 * ```
 * <a ui-sref="foo">Go to foo</a>
 * <div ui-view> <!-- decorated template references the downgraded component -->
 *   <ui-view-ng-upgrade> <!-- downgraded adapter component -->
 *   </ui-view-ng-upgrade>
 * </div>
 * ```
 *
 * This downgraded ng2 Component then creates a child UIView (ng2 component)
 *
 * ```
 * <a ui-sref="foo">Go to foo</a>
 * <div ui-view> <!-- custom template references the downgraded component -->
 *   <ui-view-ng-upgrade> <!-- ng2 component adapter downgraded to ng1-->
 *     <ui-view> <!-- pure ng2 ui-view -->
 *      </ui-view>
 *   </ui-view-ng-upgrade>
 * </div>
 * ```
 *
 * which in turn is filled with the routed ng2 component.
 *
 * ```
 * <a ui-sref="foo">Go to foo</a>
 * <div ui-view> <!-- ng1 ui-view -->
 *   <ui-view-ng-upgrade> <!-- ng2 component adapter (downgraded to ng1)-->
 *     <ui-view> <!-- pure ng2 ui-view -->
 *       <ng2-routed-component> <!-- ng2 component hosted in ng2 ui-view -->
 *         <h1>ng2 routed component contents</h1>
 *       </ng2-routed-component>
 *     </ui-view>
 *   </ui-view-ng-upgrade>
 * </div>
 * ```
 *
 * This adapter exposes exposes the parent view context (ParentUIViewInject)
 * as an ng2 DI Provider, which the nested ng2 UIView requires.
 *
 * It gets the ParentUIViewContext information (from the parent ng1 ui-view) by walking
 * up the DOM and grabbing the .data('$uiView') which the ng1 ui-view directive exposes.
 */
@Component({
  selector: 'ui-view-ng-upgrade',
  template: `<ui-view [name]="name"></ui-view>`,
  // provide a blank object as PARENT_INJECT.
  // The component will add property getters when it is constructed.
  viewProviders: [ { provide: UIView.PARENT_INJECT, useValue: { } } ],
})
export class UIViewNgUpgrade {
  // The ui-view's name (or '$default')
  @Input() private name: string;

  constructor(
      ref: ElementRef,
      @Inject(UIView.PARENT_INJECT) parent: ParentUIViewInject,
      registry: StateRegistry // access the root state
  ) {
    // From the ui-view-ng-upgrade component's element ref, walk up the DOM two elements...
    // There will first be an ng1 ui-view which hosts this element, and then that ui-view's parent element.
    // That (parent) element has access to the proper "parent viewcontext"

    // The ng2 ui-view component is inside this ui-view-ng-upgrade directive, which is inside the ng1 "host" ui-view.
    // Both ui-views share the same "view context" information (the view's fqn and created-by-state context information)
    let ng1elem = angular.element(ref.nativeElement).parent().parent();

    // Expose getters on PARENT_INJECT for context (creation state) and fqn (view address)
    // These will be used by further nested UIView
    Object.defineProperty(parent, "context", {
      get: function() {
        let data = ng1elem['inheritedData']('$uiView');
        return (data && data.$cfg) ? data.$cfg.viewDecl.$context : registry.root();
      },
      enumerable: true
    });

    Object.defineProperty(parent, "fqn", {
      get: function() {
        let data = ng1elem['inheritedData']('$uiView');
        return (data && data.$uiView) ? data.$uiView.fqn : null;
      },
      enumerable: true
    });
  }
}

/**********************************
 * Ng2 @NgModule and bootstrap code
 **********************************/

// Register the ng1 DI '$uiRouter' object as an ng2 Provider.
function uiRouterUpgradeFactory(router: UIRouter, injector: Injector) {
  let modules: StatesModule[] = injector.get(UIROUTER_MODULE_TOKEN, []);
  modules.forEach(module => applyModuleConfig(router, injector, module));
  return router;
}

/**
 * This NgModule should be added to the root module of the hybrid app.
 */
@NgModule({
  imports: [UIRouterModule, UpgradeModule],
  declarations: [UIViewNgUpgrade],
  providers: [
    // @uirouter/angular code will use the ng1 $uiRouter instance instead of creating its own.
    { provide: '$uiRouter', useFactory: (i: any) => i.get('$uiRouter'), deps: ['$injector']},
    { provide: UIRouter, useFactory: uiRouterUpgradeFactory, deps: ['$uiRouter', Injector] },

    { provide: UIROUTER_ROOT_MODULE, useValue: {}, multi: true },

    ..._UIROUTER_SERVICE_PROVIDERS,

    {
      provide: UIView.PARENT_INJECT,
      deps: [StateRegistry],
      useFactory: (r: StateRegistry) => {
        return { fqn: null, context: r.root() } as ParentUIViewInject
      },
    },
  ],
  entryComponents: [
    UIViewNgUpgrade
  ],
  exports: [UIViewNgUpgrade, UIRouterModule]
}) export class Ng1ToNg2Module {}

/**
 * This function applies the ng1-to-ng2 hybrid adapter
 *
 * ---
 *
 * - expose the ng1 "$uiRouter" instance to ng2 DI (as `UIRouter`)
 * - downgrade the ng2 UIViewNgUpgrade for use in ng1 templates
 * - expose the root ng2 Injector as a resolve on the root state
 * - decorate state `views:` with ng1/ng2 component detection
 *   when ng1 is detected, use <ui-view-ng-upgrade> adapter directive as template
 * - register the ng2 ViewConfigFactory
 * - register the ng1-to-ng2 ViewConfigFactory
 *   allows both ng1 and ng2 ui-views to activate
 */
function applyHybridAdapter(ng2Injector: Injector) {
  // Downgrade the UIViewNgUpgrade ng2 Component to an ng1 directive.
  // The directive is used in a (generated) view template by the (host) ng1 ui-router,
  // whenever it finds a view configured with a `component: <Ng2ComponentClass>`
  upgradeModule.directive("uiViewNgUpgrade", <any> downgradeComponent({ 
    component: UIViewNgUpgrade,
    inputs: ['name']
   }));

  upgradeModule.run(['$injector', (ng1Injector: $InjectorLike) => {
    let $uiRouter: UIRouter = ng1Injector.get('$uiRouter');

    // Expose a merged ng1/ng2 injector as a Resolvable (on the root state).
    // This mimics how @uirouter/angular exposes the root ng2 Injector, but
    // it retrieves from ng1 injector first, then ng2 injector if the token isn't found.
    const mergedInjector = {
      get: function(token: any, ng2NotFoundValue?: any) {
        return (ng1Injector.has(token) && ng1Injector.get(token)) || ng2Injector.get(token, ng2NotFoundValue)
      }
    };

    let ng2InjectorResolvable = Resolvable.fromData(NATIVE_INJECTOR_TOKEN, mergedInjector);
    $uiRouter.stateRegistry.root().resolvables.push(ng2InjectorResolvable);
  }]);


  upgradeModule.config(['$stateProvider', ($stateProvider: StateProvider) => {
  }]);

  upgradeModule.config(['$uiRouterProvider', ($uiRouterProvider: UIRouter) => {
    let registry = $uiRouterProvider.stateRegistry;

    /** Applies the `UIRouterRx` plugin for observable states/params */
    $uiRouterProvider.plugin(UIRouterRx);

    /** Adds the ng2 `loadChildren` lazy loading decorator */
    registry.decorator('lazyLoad', ng2LazyLoadBuilder);

    /**
     * Adds a state decorator which modifies a state's view configuration as it's being registered.
     *
     * ---
     *
     * Define a stateProvider `views` builder decorator.
     * The decorator first applies the standard views builder function.
     * Then it finds any view components which are **actually** a Ng2 Component Class.
     * It overwrites that view's config with a ng1-to-ng2 hybrid config.
     *
     * In place of the template provider, it simply puts a <ui-view-ng-upgrade/> component
     * which that provides a ng1 -> ng2 boundary in the component tree.
     */
    registry.decorator('views', function(state: StateObject, parentFn: Function) {
      let views = parentFn(state);

      forEach(views, (viewDecl: any, viewName: string) => {
        if (viewDecl.$type === 'ng1-to-ng2' || isNg2ComponentClass(viewDecl.component)) {
          // Update the view config.
          // Override default ng1 `component:` behavior (of defining a templateProvider)
          // with a <ui-view-ng-upgrade> adapter directive template
          viewDecl.$type = "ng1-to-ng2";
          viewDecl.templateProvider = null;
          viewDecl.template = `<ui-view-ng-upgrade name='${viewDecl.$uiViewName}'></ui-view-ng-upgrade>`;
        }
      });
      return views;
    });
  }]);

  // UI-Router ViewConfig factories take a view declaration object from a state.views: { foo: <ViewDeclaration> }
  // and return a runtime config object (a ViewConfig)
  upgradeModule.run(['$view', '$templateFactory', ($view: ViewService, $templateFactory) => {
    // Register a ViewConfig factory for views of type `ng2`
    $view._pluginapi._viewConfigFactory('ng2', (path: PathNode[], config: Ng2ViewDeclaration) => new Ng2ViewConfig(path, config));

    // Register a ViewConfig factory for views of type `ng1-to-ng2`.
    // Returns both an ng1 config and an ng2 config allowing either ng1 or ng2 ui-view components to be targeted.
    $view._pluginapi._viewConfigFactory('ng1-to-ng2', (path: PathNode[], config: Ng2ViewDeclaration) => {
      let ng1ViewConfig: ViewConfig = <any> new Ng1ViewConfig(<any> path, <any> Object.assign({}, config, { $type: 'ng1'}), $templateFactory);
      let ng2ViewConfig: ViewConfig = <any> new Ng2ViewConfig(<any> path, <any> Object.assign({}, config, { $type: 'ng2'}));

      return [ ng2ViewConfig, ng1ViewConfig ];
    });
  }])
}

/** Predicate fn that returns true if an object is a NG2 Component Class */
export function isNg2ComponentClass(def: any) {
  if (typeof def !== 'function') return false;

  return Reflect['getMetadata']('annotations', def)
      .find((x: any) => x instanceof Component);
}

/**
 * Hybrid apps should import this and call `uiRouterNgUpgrade.setUpgradeAdapter(adapter)`.
 * This will register the ui-router hybrid adapter code.
 */
export let uiRouterNgUpgrade = {
  setNg2Injector: function(injector: Injector) {
    applyHybridAdapter(injector);
  }
};
