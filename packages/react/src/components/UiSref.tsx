import {Component, PropTypes, createElement} from 'react';
import UIRouterReact from '../index';
import {extend} from 'ui-router-core';

export class UISref extends Component<any,any> {
    static propTypes = {
        to: PropTypes.string.isRequired,
        params: PropTypes.object,
        options: PropTypes.object,
        className: PropTypes.string
    }

    constructor (props) {
        super(props);
    }

    getOptions = () => {
        let parent = UIRouterReact.instance.globals.$current.parent.name;
        let defOpts = { relative: parent, inherit: true };
        return extend(defOpts, this.props.options || {});
    }

    handleClick = (e) => {
        e.preventDefault();
        let params = this.props.params || {};
        let to = this.props.to;
        let options = this.getOptions();
        UIRouterReact.instance.stateService.go(to, params, options);
    }

    render () {
        return createElement('a', {
            onClick: this.handleClick,
            className: this.props.className
        }, this.props.children);
    }
}