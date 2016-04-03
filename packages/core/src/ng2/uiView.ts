/** @module ng2_directives */ /** */
import {Component, ElementRef, DynamicComponentLoader} from 'angular2/core';
import {Injector} from "angular2/core";
import {provide} from "angular2/core";
import {Input} from "angular2/core";
import {ComponentRef} from "angular2/core";
import {Type} from "angular2/core";

import {UIRouter} from "../router";
import {trace} from "../common/trace";
import {Inject} from "angular2/core";
import {ViewContext, ViewConfig} from "../view/interface";
import {Ng2ViewDeclaration} from "./interface";

/** @hidden */
let id = 0;

const getProviders = (injector) => {
  let providers = [], parentInj = injector.parent;
  for (let i = 0; i < parentInj._proto.numberOfProviders; i++) {
    providers.push(parentInj._proto.getProviderAtIndex(i));
  }
  return providers;
};

/**
 * A UI-Router viewport directive, which is filled in by a view (component) on a state.
 *
 * ### Selector
 *
 * A `ui-view` directive can be created as an element: `<ui-view></ui-view>` or as an attribute: `<div ui-view></div>`.
 *
 * ### Purpose
 *
 * This directive is used in a Component template (or as the root component) to create a viewport.  The viewport
 * is filled in by a view (as defined by a [[Ng2ViewDeclaration]] inside a [[Ng2StateDeclaration]]) when the view's
 * state has been activated.
 *
 * @example
 * ```js
 *
 * // This app has two states, 'foo' and 'bar'
 * stateRegistry.register({ name: 'foo', url: '/foo', component: FooComponent });
 * stateRegistry.register({ name: 'bar', url: '/bar', component: BarComponent });
 * ```
 * ```html
 * <!-- This ui-view will be filled in by the foo state's component or
 *      the bar state's component when the foo or bar state is activated -->
 * <ui-view></ui-view>
 * ```
 *
 * ### Named ui-views
 *
 * A `ui-view` may optionally be given a name via the attribute value: `<div ui-view='header'></div>`.  *Note:
 * an unnamed `ui-view` is internally named `$default`*.   When a `ui-view` has a name, it will be filled in
 * by a matching named view.
 *
 * @example
 * ```js
 *
 * stateRegistry.register({
 *   name: 'foo',
 *   url: '/foo',
 *   views: { header: HeaderComponent, $default: FooComponent });
 * ```
 * ```html
 * <!-- When 'foo' state is active, filled by HeaderComponent -->
 * <div ui-view="header"></div>
 *
 * <!-- When 'foo' state is active, filled by FooComponent -->
 * <ui-view></ui-view>
 * ```
 */
@Component({
  selector: 'ui-view, [ui-view]',
  styles: [`
    .done-true {
      text-decoration: line-through;
      color: grey;
    }`
  ],
  template: `<div #content></div>`,
  // template: `
  // <div style="padding: 1em; border: 1px solid lightgrey;">
  //
  //   <div #content style="color: lightgrey; font-size: smaller;">
  //     <div>ui-view #{{uiViewData.id}} created by '{{ parentContext.name || "(root)" }}' state</div>
  //     <div>name: (absolute) '{{uiViewData.fqn}}' (contextual) '{{uiViewData.name}}@{{parentContext.name}}' </div>
  //     <div>currently filled by: '{{(uiViewData.config && uiViewData.config.viewDecl.$context) || 'empty...'}}'</div>
  //   </div>
  //
  // </div>`
})
export class UiView {
  @Input() name: string;
  @Input() set 'ui-view'(val) { this.name = val; }

  componentRef: ComponentRef;
  deregister: Function;
  uiViewData: any = {};

  static INJECT = {
    fqn: "UiView.parentFQN",
    context: "UiView.parentContext"
  };

  constructor(
      public router: UIRouter,
      @Inject(UiView.INJECT.context) public parentContext: ViewContext,
      @Inject(UiView.INJECT.fqn) public parentFqn: string,
      public dcl: DynamicComponentLoader,
      public elementRef: ElementRef,
      public injector: Injector
  ) { }

  ngOnInit() {
    let parentFqn = this.parentFqn;
    let name = this.name || '$default';

    this.uiViewData = {
      id: id++,
      name: name,
      fqn: parentFqn ? parentFqn + "." + name : name,
      creationContext: this.parentContext,
      configUpdated: this.viewConfigUpdated.bind(this),
      config: undefined
    };

    this.deregister = this.router.viewService.registerUiView(this.uiViewData);
  }

  disposeLast() {
    if (this.componentRef) this.componentRef.dispose();
  }

  ngOnDestroy() {
    this.deregister();
    this.disposeLast();
  }

  viewConfigUpdated(config: ViewConfig) {
    if (!config) {
      return this.disposeLast();
    }

    let {uiViewData, injector, dcl, elementRef} = this;
    let viewDecl = <Ng2ViewDeclaration> config.viewDecl;

    // The "new" viewconfig is already applied, so exit early
    if (uiViewData.config === config) return;
    // This is a new viewconfig.  Destroy the old component
    this.disposeLast();
    trace.traceUiViewConfigUpdated(uiViewData, config && config.viewDecl.$context);
    uiViewData.config = config;
    // The config may be undefined if there is nothing state currently targeting this UiView.
    if (!config) return;

    // Do some magic
    let rc = config.node.resolveContext;
    let resolvables = rc.getResolvables();
    let rawProviders = Object.keys(resolvables).map(key => provide(key, { useValue: resolvables[key].data }));
    rawProviders.push(provide(UiView.INJECT.context, { useValue: config.viewDecl.$context }));
    rawProviders.push(provide(UiView.INJECT.fqn, { useValue: uiViewData.fqn }));
    let providers = Injector.resolve(rawProviders);

    let exclusions = [UiView.INJECT.context, UiView.INJECT.fqn];
    providers = getProviders(injector).filter(x => exclusions.indexOf(x.key.displayName) === -1).concat(providers);

    // The 'controller' should be a Component class
    // TODO: pull from 'component' declaration, do not require template.
    let component = <Type> viewDecl.component;
    dcl.loadIntoLocation(component, elementRef, "content", providers).then(ref => this.componentRef = ref);
  }
}

