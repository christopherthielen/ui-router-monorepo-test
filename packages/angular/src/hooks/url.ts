import {UrlRouter} from "../url/urlRouter";
import {StateService} from "../state/stateService";
import {Transition} from "../transition/transition";
import {UiInjector} from "../common/interface";
import {UiRouter} from "../router";

export function updateUrl(transition: Transition) {
  let options = transition.options();
  let $state: StateService = transition.router.stateService;
  let $urlRouter: UrlRouter = transition.router.urlRouter;

  if (options.location && $state.$current.navigable) {
    var urlOptions = {replace: options.location === 'replace'};
    $urlRouter.push($state.$current.navigable.url, $state.params, urlOptions);
  }

  $urlRouter.update(true);
}
