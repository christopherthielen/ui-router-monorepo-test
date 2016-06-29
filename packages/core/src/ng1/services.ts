/**
 * # UI-Router for Angular 1
 *
 * - Provides an implementation for the [[CoreServices]] API, based on angular 1 services.
 * - Also registers some services with the angular 1 injector.
 * - Creates and bootstraps a new [[UiRouter]] object.  Ties it to the the angular 1 lifecycle.
 *
 * @module ng1
 * @preferred
 */

/** for typedoc */
import {UiRouter} from "../router";
import {services} from "../common/coreservices";
import {bindFunctions, removeFrom, applyPairs} from "../common/common";
import {prop} from "../common/hof";
import {isObject, isString} from "../common/predicates";
import {resolveFactory} from "./legacy/resolveService";
import {trace} from "../common/trace";
import {ng1ViewsBuilder, ng1ViewConfigFactory} from "./statebuilders/views";
import {TemplateFactory} from "./templateFactory";
import {StateParams} from "../params/stateParams";
import {TransitionService} from "../transition/transitionService";
import {StateService} from "../state/stateService";
import {StateProvider} from "../state/state";
import {UrlRouterProvider, UrlRouter} from "../url/urlRouter";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";
import {getStateHookBuilder} from "./statebuilders/onEnterExitRetain";
import {ResolveContext} from "../resolve/resolveContext";
import IInjectorService = angular.auto.IInjectorService;

/** @hidden */
let app = angular.module("ui.router.angular1", []);

/**
 * @ngdoc overview
 * @name ui.router.util
 *
 * @description
 * # ui.router.util sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.util', ['ng', 'ui.router.init']);

/**
 * @ngdoc overview
 * @name ui.router.router
 *
 * @requires ui.router.util
 *
 * @description
 * # ui.router.router sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 */
angular.module('ui.router.router', ['ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router.state
 *
 * @requires ui.router.router
 * @requires ui.router.util
 *
 * @description
 * # ui.router.state sub-module
 *
 * This module is a dependency of the main ui.router module. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.state', ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);

/**
 * @ngdoc overview
 * @name ui.router
 *
 * @requires ui.router.state
 *
 * @description
 * # ui.router
 *
 * ## The main module for ui.router
 * There are several sub-modules included with the ui.router module, however only this module is needed
 * as a dependency within your angular app. The other modules are for organization purposes.
 *
 * The modules are:
 * * ui.router - the main "umbrella" module
 * * ui.router.router -
 *
 * *You'll need to include **only** this module as the dependency within your angular app.*
 *
 * <pre>
 * <!doctype html>
 * <html ng-app="myApp">
 * <head>
 *   <script src="js/angular.js"></script>
 *   <!-- Include the ui-router script -->
 *   <script src="js/angular-ui-router.min.js"></script>
 *   <script>
 *     // ...and add 'ui.router' as a dependency
 *     var myApp = angular.module('myApp', ['ui.router']);
 *   </script>
 * </head>
 * <body>
 * </body>
 * </html>
 * </pre>
 */
angular.module('ui.router', ['ui.router.init', 'ui.router.state', 'ui.router.angular1']);

angular.module('ui.router.compat', ['ui.router']);

/**
 * Annotates a controller expression (may be a controller function(), a "controllername",
 * or "controllername as name")
 *
 * - Temporarily decorates $injector.instantiate.
 * - Invokes $controller() service
 *   - Calls $injector.instantiate with controller constructor
 * - Annotate constructor
 * - Undecorate $injector
 *
 * returns an array of strings, which are the arguments of the controller expression
 */

export function annotateController(controllerExpression): string[] {
  let $injector = services.$injector;
  let $controller = $injector.get("$controller");
  let oldInstantiate = $injector.instantiate;
  try {
    let deps;

    $injector.instantiate = function fakeInstantiate(constructorFunction) {
      $injector.instantiate = oldInstantiate; // Un-decorate ASAP
      deps = $injector.annotate(constructorFunction);
    };

    $controller(controllerExpression, { $scope: {} });

    return deps;
  } finally {
    $injector.instantiate = oldInstantiate;
  }
}

runBlock.$inject = ['$injector', '$q'];
function runBlock($injector, $q) {
  services.$injector = $injector;
  services.$q = $q;
}

app.run(runBlock);

let router: UiRouter = null;

ng1UiRouter.$inject = ['$locationProvider'];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
function ng1UiRouter($locationProvider) {

  // Create a new instance of the Router when the ng1UiRouterProvider is initialized
  router = new UiRouter();
  
  // Apply ng1 specific StateBuilder code for `views`, `resolve`, and `onExit/Retain/Enter` properties
  router.stateRegistry.decorator("views", ng1ViewsBuilder);
  router.stateRegistry.decorator("onExit", getStateHookBuilder("onExit"));
  router.stateRegistry.decorator("onRetain", getStateHookBuilder("onRetain"));
  router.stateRegistry.decorator("onEnter", getStateHookBuilder("onEnter"));

  router.viewService.viewConfigFactory('ng1', ng1ViewConfigFactory);

  // Bind LocationConfig.hashPrefix to $locationProvider.hashPrefix
  bindFunctions($locationProvider, services.locationConfig, $locationProvider, ['hashPrefix']);

  // Create a LocationService.onChange registry
  let urlListeners: Function[] = [];
  services.location.onChange = (callback) => {
    urlListeners.push(callback);
    return () => removeFrom(urlListeners)(callback);
  };

  this.$get = $get;
  $get.$inject = ['$location', '$browser', '$sniffer', '$rootScope', '$http', '$templateCache'];
  function $get($location, $browser, $sniffer, $rootScope, $http, $templateCache) {

    // Bind $locationChangeSuccess to the listeners registered in LocationService.onChange
    $rootScope.$on("$locationChangeSuccess", evt => urlListeners.forEach(fn => fn(evt)));

    // Bind LocationConfig.html5Mode to $locationProvider.html5Mode and $sniffer.history
    services.locationConfig.html5Mode = function() {
      let html5Mode = $locationProvider.html5Mode();
      html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
      return html5Mode && $sniffer.history;
    };

    services.template.get = (url: string) =>
        $http.get(url, { cache: $templateCache, headers: { Accept: 'text/html' }}).then(prop("data"));

    // Bind these LocationService functions to $location
    bindFunctions($location, services.location, $location, ["replace", "url", "path", "search", "hash"]);
    // Bind these LocationConfig functions to $location
    bindFunctions($location, services.locationConfig, $location, ['port', 'protocol', 'host']);
    // Bind these LocationConfig functions to $browser
    bindFunctions($browser, services.locationConfig, $browser, ['baseHref']);

    return router;
  }
}

function $stateParamsFactory(ng1UiRouter) {
  return ng1UiRouter.globals.params;
}

// The 'ui.router' ng1 module depends on 'ui.router.init' module.
angular.module('ui.router.init', []).provider("ng1UiRouter", <any> ng1UiRouter);
// This effectively calls $get() to init when we enter runtime
angular.module('ui.router.init').run(['ng1UiRouter', function(ng1UiRouter) { }]);

// $urlMatcherFactory service and $urlMatcherFactoryProvider
angular.module('ui.router.util').provider('$urlMatcherFactory', ['ng1UiRouterProvider', () => router.urlMatcherFactory]);
angular.module('ui.router.util').run(['$urlMatcherFactory', function($urlMatcherFactory) { }]);

// $urlRouter service and $urlRouterProvider
function getUrlRouterProvider() {
  router.urlRouterProvider["$get"] = function() {
    router.urlRouter.update(true);
    if (!this.interceptDeferred) router.urlRouter.listen();
    return router.urlRouter;
  };
  return router.urlRouterProvider;
}
angular.module('ui.router.router').provider('$urlRouter', ['ng1UiRouterProvider', getUrlRouterProvider]);
angular.module('ui.router.router').run(['$urlRouter', function($urlRouter) { }]);

// $state service and $stateProvider
// $urlRouter service and $urlRouterProvider
function getStateProvider() {
  router.stateProvider["$get"] = function() {
    // Autoflush once we are in runtime
    router.stateRegistry.stateQueue.autoFlush(router.stateService);
    return router.stateService;
  };
  return router.stateProvider;
}
angular.module('ui.router.state').provider('$state', ['ng1UiRouterProvider', getStateProvider]);
angular.module('ui.router.state').run(['$state', function($state) { }]);

// $stateParams service
angular.module('ui.router.state').factory('$stateParams', ['ng1UiRouter', (ng1UiRouter) =>
    ng1UiRouter.globals.params]);

// $transitions service and $transitionsProvider
function getTransitionsProvider() {
  router.transitionService["$get"] = () => router.transitionService;
  return router.transitionService;
}
angular.module('ui.router.state').provider('$transitions', ['ng1UiRouterProvider', getTransitionsProvider]);

// $templateFactory service
angular.module('ui.router.util').factory('$templateFactory', ['ng1UiRouter', () => new TemplateFactory()]);

// The $view service
angular.module('ui.router').factory('$view', () => router.viewService);

// The old $resolve service
angular.module('ui.router').factory('$resolve', <any> resolveFactory);

// $trace service
angular.module("ui.router").service("$trace", () => trace);
watchDigests.$inject = ['$rootScope'];
export function watchDigests($rootScope) {
  $rootScope.$watch(function() { trace.approximateDigests++; });
}
angular.module("ui.router").run(watchDigests);

export const getLocals = (ctx: ResolveContext) => {
  let tokens = ctx.getTokens().filter(isString);
  let tuples = tokens.map(key => [ key, ctx.getResolvable(key).data ]);
  return tuples.reduce(applyPairs, {});
};

/** Adds the angular 1 `$injector` to the `UiInjector` interface */
declare module "../common/interface" {
  /**
   * This enhances the [[common.UiInjector]] interface by adding the `$injector` service as the [[native]] injector.
   */
  interface UiInjector {
    /**
     * The native Angular 1 `$injector` service
     *
     * When you have access to a `UiInjector`, this property will contain the native `$injector` Angular 1 service.
     *
     * @example:
     * ```js
     *
     * $transition.onStart({}, function(transition) {
     *   var uiInjector = transition.injector();
     *   var $injector = uiInjector.native;
     *   var val = $injector.invoke(someFunction);
     * });
     */
    native: IInjectorService;
  }
}

/** Injectable services */

/**
 * An injectable service object which has the current state parameters
 *
 * This angular service (singleton object) holds the current state parameters.
 * The values in `$stateParams` are not updated until *after* a [[Transition]] successfully completes.
 *
 * This object can be injected into other services.
 *
 * @example
 * ```js
 *
 * SomeService.$inject = ['$http', '$stateParams'];
 * function SomeService($http, $stateParams) {
 *   return {
 *     getUser: function() {
 *       return $http.get('/api/users/' + $stateParams.username);
 *     }
 *   }
 * };
 * angular.service('SomeService', SomeService);
 * ```
 *
 * ### Deprecation warning:
 *
 * When `$stateParams` is injected into transition hooks, resolves and view controllers, they receive a different
 * object than this global service object.  In those cases, the injected object has the parameter values for the
 * *pending* Transition.
 *
 * Because of these confusing details, this service is deprecated.
 *
 * @deprecated Instead of using `$stateParams, inject the current [[Transition]] as `$transition$` and use [[Transition.params]]
 * ```js
 * MyController.$inject = ['$transition$'];
 * function MyController($transition$) {
 *   var username = $transition$.params().username;
 *   // .. do something with username
 * }
 * ```
 */
var $stateParams: StateParams;

/**
 * An injectable service primarily used to register transition hooks
 *
 * This angular service exposes the [[TransitionService]] singleton, which is primarily used to add transition hooks.
 *
 * The same object is also exposed as [[$transitionsProvider]] for injection during angular config time.
 */
var $transitions: TransitionService;

/**
 * A config-time injectable provider primarily used to register transition hooks
 *
 * This angular provider exposes the [[TransitionService]] singleton, which is primarily used to add transition hooks.
 *
 * The same object is also exposed as [[$transitions]] for injection at runtime.
 */
var $transitionsProvider: TransitionService;

/**
 * An injectable service used to query for current state information.
 *
 * This angular service exposes the [[StateService]] singleton.
 */
var $state: StateService;

/**
 * A config-time injectable provider used to register states.
 *
 * This angular service exposes the [[StateProvider]] singleton.
 */
var $stateProvider: StateProvider;

/**
 * A config-time injectable provider used to manage the URL.
 *
 * This angular service exposes the [[UrlRouterProvider]] singleton.
 */
var $urlRouterProvider: UrlRouterProvider;

/**
 * An injectable service used to configure URL redirects.
 *
 * This angular service exposes the [[UrlRouter]] singleton.
 */
var $urlRouter: UrlRouter;

/**
 * An injectable service used to configure the URL.
 *
 * This service is used to set url mapping options, and create [[UrlMatcher]] objects.
 *
 * This angular service exposes the [[UrlMatcherFactory]] singleton.
 * The singleton is also exposed at config-time as the [[$urlMatcherFactoryProvider]].
 */
var $urlMatcherFactory: UrlMatcherFactory;

/**
 * An injectable service used to configure the URL.
 * 
 * This service is used to set url mapping options, and create [[UrlMatcher]] objects.
 *
 * This angular service exposes the [[UrlMatcherFactory]] singleton at config-time.
 * The singleton is also exposed at runtime as the [[$urlMatcherFactory]].
 */
var $urlMatcherFactoryProvider: UrlMatcherFactory;


