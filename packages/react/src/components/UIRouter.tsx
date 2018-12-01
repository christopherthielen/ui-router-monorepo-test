/**
 * @reactapi
 * @module components
 */ /** */
import * as React from 'react';
import { useRef } from 'react';
import { Component } from 'react';
import * as PropTypes from 'prop-types';

import { UIRouterPlugin, servicesPlugin, PluginFactory } from '@uirouter/core';

import { UIRouterReact, ReactStateDeclaration } from '../index';

/**
 * This Context component lets you access the UIRouter instance
 * anywhere in the component tree, by simply wrapping your component and
 * using the function-as-child pattern to pass the instance via props.
 *
 * #### Example:
 * ```jsx
 * <UIRouterContext.Consumer>
 *  {router => <MyComponent router={router} />}
 * </UIRouterContext.Consumer>
 * ```
 */
export const UIRouterContext = React.createContext<UIRouterReact>(undefined);

export interface UIRouterProps {
  plugins?: Array<PluginFactory<UIRouterPlugin>>;
  states?: Array<ReactStateDeclaration>;
  config?: (router: UIRouterReact) => void;
  router?: UIRouterReact;
  children: any;
}

/** @hidden */
export const InstanceOrPluginsMissingError = new Error(`Router instance or plugins missing.
 You must either provide a location plugin via the plugins prop:
 
 <UIRouter plugins={[pushStateLocationPlugin]} states={[···]}>
   <UIView />
 </UIRouter>
 
 or initialize the router yourself and pass the instance via props:
 
 const router = new UIRouterReact();
 router.plugin(pushStateLocationPlugin);
 ···
 <UIRouter router={router}>
   <UIView />
 </UIRouter>
 `);

/** @hidden */
export const UIRouterInstanceUndefinedError = new Error(
  `UIRouter instance is undefined. Did you forget to include the <UIRouter> as root component?`
);

/**
 * @internalapi
 *
 * This React Hook creates and initialises the UIRouter instance, registering router states,
 * plugins, and running any config provided by the user. It's used internally in by
 * the [[<UIRouter>]] Component.
 *
 * #### Example:
 * ```jsx
 * const uiRouter = useUIRouter(config, states, plugins, router);
 * ```
 */
export function useUIRouter(
  configFn: (router: UIRouterReact) => void,
  states: Array<ReactStateDeclaration>,
  plugins: Array<PluginFactory<UIRouterPlugin>>,
  router?: UIRouterReact
): UIRouterReact {
  const uiRouter = useRef<UIRouterReact>(router || null);

  // Router hasn't been initialised yet, this is the first render
  if (uiRouter.current === null) {
    if (plugins) {
      // We need to create a new instance of the Router and register plugins, config and states
      uiRouter.current = new UIRouterReact();
      uiRouter.current.plugin(servicesPlugin); // services plugins is necessary for the router to fuction
      plugins.forEach(plugin => uiRouter.current.plugin(plugin));
      if (configFn) configFn(uiRouter.current);
      (states || []).forEach(state =>
        uiRouter.current.stateRegistry.register(state)
      );
    } else {
      throw InstanceOrPluginsMissingError;
    }

    uiRouter.current.start();
  }

  return uiRouter.current;
}

/**
 * This is the root UIRouter component, needed for initialising the router and setting up configuration properly.
 * Every other component from this library needs to be a descendant of `<UIRouter>`, so ideally you want to use it as root of your app.
 *
 * ### Config
 *
 * There are two ways to set up the router: you can either bootstrap it manually and pass the instance to the component,
 * or pass the necessary information and let the component do it for you.
 *
 * #### Component Setup (suggested)
 *
 * Setting up the router via this component is pretty straightforward:
 *
 * ```jsx
 * const Home = () => <div>Home</div>;
 *
 * const states = [{
 *   name: 'home',
 *   component: Home,
 *   url: '/home'
 * }];
 *
 * const plugins = [pushStateLocationPlugin];
 *
 * ReactDOM.render(
 *   <UIRouter plugins={plugins} states={states}>
 *     <UIView />
 *   </UIRouter>,
 *   document.getElementById('root'),
 * );
 * ```
 *
 * Optionally, you may want to access the router instance once to setup additional configuration, like registering [[TransitionHook]]s.
 * To do so, you may pass a `config` function that will be called with the newly created `router` instance as argument:
 *
 * ```jsx
 * const config = router => {
 *   // register home state as the intial one
 *   router.urlService.rules.initial({ state: 'home' });
 * }
 *
 * ReactDOM.render(
 *   <UIRouter plugins={plugins} states={states} config={config}>
 *     <UIView />
 *   </UIRouter>,
 *   document.getElementById('root'),
 * );
 * ```
 *
 * #### Manual Setup (advanced)
 * Alternatevely you may setup the router manually (i.e. exctracting the router configuration to another file).
 * You can do that by createing a new instance of the router and pass it to the component, this way the component will skip the previous props and just use the provided instance.
 *
 * > NB: since you are manually bootstrapping the router, you must register the servicesPlugin as well as the location plugin of your choice (in this example the [[pushStateLocationPlugin]]).
 *
 * ```jsx
 * const router = new UIRouterReact();
 * // activate plugins
 * router.plugin(servicesPlugin);
 * router.plugin(pushStateLocationPlugin);
 * // register states
 * router.stateRegistry.register(someState);
 * // start the router
 * router.start();
 *
 * ReactDOM.render(
 *   <UIRouter router={router}>
 *     <UIView />
 *   </UIRouter>,
 *   document.getElementById("root")
 * );
 * ```
 */
export function UIRouter({
  config,
  states,
  plugins,
  router,
  children,
}: UIRouterProps) {
  const uiRouter = useUIRouter(config, states, plugins, router);

  return (
    <UIRouterContext.Provider value={uiRouter}>
      {children}
    </UIRouterContext.Provider>
  );
}
