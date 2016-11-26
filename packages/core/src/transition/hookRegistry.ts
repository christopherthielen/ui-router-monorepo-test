/** @coreapi @module transition */ /** for typedoc */
import {extend, removeFrom, allTrueR, tail} from "../common/common";
import {isString, isFunction} from "../common/predicates";
import {PathNode} from "../path/node";
import {TransitionStateHookFn, TransitionHookFn} from "./interface"; // has or is using

import {
    HookRegOptions, HookMatchCriteria, IHookRegistration, TreeChanges,
    HookMatchCriterion, IMatchingNodes, HookFn
} from "./interface";
import {Glob} from "../common/glob";
import {State} from "../state/stateObject";
import {TransitionHookType} from "./transitionHookType";

/**
 * Determines if the given state matches the matchCriteria
 *
 * @hidden
 *
 * @param state a State Object to test against
 * @param criterion
 * - If a string, matchState uses the string as a glob-matcher against the state name
 * - If an array (of strings), matchState uses each string in the array as a glob-matchers against the state name
 *   and returns a positive match if any of the globs match.
 * - If a function, matchState calls the function with the state and returns true if the function's result is truthy.
 * @returns {boolean}
 */
export function matchState(state: State, criterion: HookMatchCriterion) {
  let toMatch = isString(criterion) ? [criterion] : criterion;

  function matchGlobs(_state: State) {
    let globStrings = <string[]> toMatch;
    for (let i = 0; i < globStrings.length; i++) {
      let glob = new Glob(globStrings[i]);

      if ((glob && glob.matches(_state.name)) || (!glob && globStrings[i] === _state.name)) {
        return true;
      }
    }
    return false;
  }

  let matchFn = <any> (isFunction(toMatch) ? toMatch : matchGlobs);
  return !!matchFn(state);
}

/**
 * @hidden
 * The registration data for a registered transition hook
 */
export class RegisteredHook implements RegisteredHook {
  hookType: TransitionHookType;
  callback: HookFn;
  matchCriteria: HookMatchCriteria;
  priority: number;
  bind: any;
  _deregistered: boolean;

  constructor(hookType: TransitionHookType,
              matchCriteria: HookMatchCriteria,
              callback: HookFn,
              options: HookRegOptions = <any>{}) {
    this.hookType = hookType;
    this.callback = callback;
    this.matchCriteria = extend({ to: true, from: true, exiting: true, retained: true, entering: true }, matchCriteria);
    this.priority = options.priority || 0;
    this.bind = options.bind || null;
    this._deregistered = false;
  }

  private static _matchingNodes(nodes: PathNode[], criterion: HookMatchCriterion): PathNode[] {
    if (criterion === true) return nodes;
    let matching = nodes.filter(node => matchState(node.state, criterion));
    return matching.length ? matching : null;
  }

  /**
   * Determines if this hook's [[matchCriteria]] match the given [[TreeChanges]]
   *
   * @returns an IMatchingNodes object, or null. If an IMatchingNodes object is returned, its values
   * are the matching [[PathNode]]s for each [[HookMatchCriterion]] (to, from, exiting, retained, entering)
   */
  matches(treeChanges: TreeChanges): IMatchingNodes {
    let mc = this.matchCriteria, _matchingNodes = RegisteredHook._matchingNodes;

    let matches: IMatchingNodes = {
      to:       _matchingNodes([tail(treeChanges.to)], mc.to),
      from:     _matchingNodes([tail(treeChanges.from)], mc.from),
      exiting:  _matchingNodes(treeChanges.exiting, mc.exiting),
      retained: _matchingNodes(treeChanges.retained, mc.retained),
      entering: _matchingNodes(treeChanges.entering, mc.entering),
    };

    // Check if all the criteria matched the TreeChanges object
    let allMatched: boolean = ["to", "from", "exiting", "retained", "entering"]
        .map(prop => matches[prop])
        .reduce(allTrueR, true);

    return allMatched ? matches : null;
  }
}

/** @hidden */
export interface RegisteredHooks {
  [key: string]: RegisteredHook[];
}

/** @hidden Return a registration function of the requested type. */
export function makeHookRegistrationFn(registeredHooks: RegisteredHooks, type: TransitionHookType): IHookRegistration {
  let name = type.name;
  registeredHooks[name] = [];

  return function (matchObject, callback, options = {}) {
    let registeredHook = new RegisteredHook(type, matchObject, callback, options);
    registeredHooks[name].push(registeredHook);

    return function deregisterEventHook() {
      registeredHook._deregistered = true;
      removeFrom(registeredHooks[name])(registeredHook);
    };
  };
}