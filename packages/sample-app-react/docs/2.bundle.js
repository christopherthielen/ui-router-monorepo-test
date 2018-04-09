(window.webpackJsonp=window.webpackJsonp||[]).push([[2],{128:
/*!**********************************!*\
  !*** ./src/mymessages/states.js ***!
  \**********************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.states=void 0;var r=n(/*! ../global/dataSources */131),a=i(n(/*! ./messageListUIService */135)),o=i(n(/*! ./Compose */141)),s=i(n(/*! ./MyMessages */140)),u=i(n(/*! ./Message */139)),l=i(n(/*! ./MessageList */138));function i(e){return e&&e.__esModule?e:{default:e}}var c={name:"mymessages.compose",url:"/compose",params:{message:{}},views:{"!$default.$default":o.default}},f={parent:"app",name:"mymessages",url:"/mymessages",resolve:[{token:"folders",resolveFn:function(){return r.FoldersStorage.all()}}],redirectTo:"mymessages.messagelist",component:s.default,data:{requiresAuth:!0}},d={name:"mymessages.messagelist.message",url:"/:messageId",resolve:[{token:"message",deps:["$transition$"],resolveFn:function(e){return r.MessagesStorage.get(e.params().messageId)}},{token:"nextMessageGetter",deps:["messages"],resolveFn:function(e){return a.default.proximalMessageId.bind(a.default,e)}}],views:{"^.^.messagecontent":u.default}},p={name:"mymessages.messagelist",url:"/:folderId",params:{folderId:"inbox"},resolve:[{token:"folder",deps:["$transition$"],resolveFn:function(e){return r.FoldersStorage.get(e.params().folderId)}},{token:"messages",deps:["folder"],resolveFn:function(e){return r.MessagesStorage.byFolder(e)}}],views:{messagelist:l.default}};t.states=[c,d,p,f]},131:
/*!***********************************!*\
  !*** ./src/global/dataSources.js ***!
  \***********************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MessagesStorage=t.FoldersStorage=t.ContactsStorage=void 0;var r,a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),o=n(/*! ../util/sessionStorage */134),s=n(/*! ./appConfig */27),u=(r=s)&&r.__esModule?r:{default:r};function l(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function c(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var f=function(e){function t(){return l(this,t),i(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,"contacts","static/data/contacts.json"))}return c(t,o.SessionStorage),t}(),d=function(e){function t(){return l(this,t),i(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,"folders","static/data/folders.json"))}return c(t,o.SessionStorage),t}(),p=function(e){function t(){return l(this,t),i(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,"messages","static/data/messages.json"))}return c(t,o.SessionStorage),a(t,[{key:"byFolder",value:function(e){var t={folder:e._id};return t[-1!==["drafts","sent"].indexOf(e._id)?"from":"to"]=u.default.emailAddress,this.search(t)}}]),t}(),m=new f,b=new d,y=new p;t.ContactsStorage=m,t.FoldersStorage=b,t.MessagesStorage=y},133:
/*!**************************!*\
  !*** ./src/util/util.js ***!
  \**************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.setProp=function(e,t,n){return e[t]=n,e};var r=t.pushToArr=function(e,t){return e.push(t),e},a=(t.uniqReduce=function(e,t){return-1!==e.indexOf(t)?e:r(e,t)},t.flattenReduce=function(e,t){return e.concat(t)},function(e){return"x"!==e&&"y"!==e?"-":Math.floor(16*Math.random()).toString(16).toUpperCase()});t.guid=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("").map(a).join("")}},134:
/*!************************************!*\
  !*** ./src/util/sessionStorage.js ***!
  \************************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.SessionStorage=void 0;var r,a=n(/*! ./util */133),o=n(/*! ../global/appConfig */27),s=(r=o)&&r.__esModule?r:{default:r};t.SessionStorage=function e(t,n){var r=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),u.call(this);var o=void 0,s=sessionStorage.getItem(t);if(this._data=void 0,this._idProp="_id",this._eqFn=function(e,t){return e[r._idProp]===t[r._idProp]},this.sessionStorageKey=t,s)try{o=JSON.parse(s)}catch(e){console.log("Unable to parse session messages, retrieving intial data.")}var l=function(e){return(0,a.setProp)(e,"$$hashKey",void 0)};this._data=(o?Promise.resolve(o):fetch(n).then(function(e){return e.json()})).then(this._commit).then(function(){return JSON.parse(sessionStorage.getItem(t))}).then(function(e){return e.map(l)})};var u=function(){var e=this;this._commit=function(t){return sessionStorage.setItem(e.sessionStorageKey,JSON.stringify(t)),Promise.resolve(t)},this.all=function(t){return new Promise(function(t,n){setTimeout(function(){return t(e._data)},s.default.restDelay)}).then(t)},this.search=function(t){return e.all(function(e){return e.filter(function(e,t){return Object.keys(e).reduce(function(n,r){return n&&(a=e[r],-1!==(""+t[r]).indexOf(""+a));var a},!0)}.bind(null,t))})},this.get=function(t){return e.all(function(n){return n.find(function(n){return n[e._idProp]===t})})},this.save=function(t){return t[e._idProp]?e.put(t):e.post(t)},this.post=function(t){return t[e._idProp]=(0,a.guid)(),e.all(function(e){return(0,a.pushToArr)(e,t)}).then(e._commit.bind(e))},this.put=function(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:e._eqFn;return e.all(function(r){var a=r.findIndex(n.bind(null,t));if(-1===a)throw Error(t+" not found in "+e);return r[a]=t,e._commit(r).then(function(){return t})})},this.remove=function(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:e._eqFn;return e.all(function(r){var a=r.findIndex(n.bind(null,t));if(-1===a)throw Error(t+" not found in "+e);return r.splice(a,1),e._commit(r).then(function(){return t})})}}},135:
/*!************************************************!*\
  !*** ./src/mymessages/messageListUIService.js ***!
  \************************************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();t.orderBy=u;var a,o=n(/*! ../global/appConfig */27),s=(a=o)&&a.__esModule?a:{default:a};function u(e){var t=1;return"+"!==e.charAt(0)&&"-"!==e.charAt(0)||(t="-"===e.charAt(0)?-1:1,e=e.substring(1)),function(n,r){var a=0,o=n[e],s=r[e];return o<s&&(a=-1),o>s&&(a=1),a*t}}var l=new(function(){function e(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e)}return r(e,[{key:"proximalMessageId",value:function(e,t){var n=e.sort(u(s.default.sort)),r=n.findIndex(function(e){return e._id===t}),a=n.length>r+1?r+1:r-1;return a>=0?n[a]._id:void 0}}]),e}());t.default=l},136:
/*!***************************************************!*\
  !*** ./src/mymessages/components/SortMessages.js ***!
  \***************************************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=n(/*! react */4),o=u(a),s=u(n(/*! prop-types */8));function u(e){return e&&e.__esModule?e:{default:e}}function l(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}var i=function(e){function t(){var e,n,r;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);for(var a=arguments.length,o=Array(a),s=0;s<a;s++)o[s]=arguments[s];return n=r=l(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(o))),r.handleClick=function(e){var t=r.props,n=t.col,a=t.sort;(0,t.onChangeSort)(a==="+"+n?"-"+n:"+"+n)},l(r,n)}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.Component),r(t,[{key:"render",value:function(){var e=this.props,t=e.col,n=e.label,r=e.sort,a="";r=="+"+t?a="fa-sort-asc":r=="-"+t&&(a="fa-sort-desc");var s=o.default.createElement("i",{style:{paddingLeft:"0.25em"},className:"fa "+a});return o.default.createElement("span",{onClick:this.handleClick},n," ",s)}}]),t}();i.propTypes={label:s.default.string,col:s.default.string,sort:s.default.string,onChangeSort:s.default.func},t.default=i},137:
/*!***************************************************!*\
  !*** ./src/mymessages/components/MessageTable.js ***!
  \***************************************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=n(/*! react */4),o=f(a),s=f(n(/*! prop-types */8)),u=n(/*! @uirouter/react */9),l=n(/*! ../messageListUIService */135),i=f(n(/*! ../../global/appConfig */27)),c=f(n(/*! ./SortMessages */136));function f(e){return e&&e.__esModule?e:{default:e}}var d=[{label:"",name:"read"},{label:"Sender",name:"from"},{label:"Recipient",name:"to"},{label:"Subject",name:"subject"},{label:"Date",name:"date"}],p=function(e){function t(e){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var n=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.colVisible=function(e){return-1!==n.props.columns.indexOf(e)},n.changeSort=function(e){return n.setState({sort:e})},n.formattedContent=function(e,t){return"date"===t?new Date(e[t]).toISOString().slice(0,10):"read"===t?e[t]?"":o.default.createElement("i",{className:"fa fa-circle",style:{fontSize:"50%"}}):e[t]},n.state={sort:i.default.sort},n}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.Component),r(t,[{key:"render",value:function(){var e=this,t=this.state.sort,n=this.props.messages,r=d.filter(function(t){return e.colVisible(t.name)}),a=r.map(function(n){return o.default.createElement("td",{key:n.name},o.default.createElement(c.default,{label:n.label,col:n.name,sort:t,onChangeSort:e.changeSort}))}),s=n.sort((0,l.orderBy)(t)).map(function(t){return o.default.createElement(u.UISrefActive,{key:t._id,class:"active"},o.default.createElement(u.UISref,{to:".message",params:{messageId:t._id}},o.default.createElement("tr",null,r.map(function(n){return o.default.createElement("td",{key:n.name},e.formattedContent(t,n.name))}))))});return o.default.createElement("table",null,o.default.createElement("thead",null,o.default.createElement("tr",null,a)),o.default.createElement("tbody",null,s))}}]),t}();p.propTypes={messages:s.default.arrayOf(s.default.object),columns:s.default.arrayOf(s.default.string)},t.default=p},138:
/*!***************************************!*\
  !*** ./src/mymessages/MessageList.js ***!
  \***************************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=n(/*! react */4),o=l(a),s=l(n(/*! prop-types */8)),u=l(n(/*! ./components/MessageTable */137));function l(e){return e&&e.__esModule?e:{default:e}}var i=function(e){function t(){return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.Component),r(t,[{key:"render",value:function(){var e=this.props,t=e.folder,n=e.messages;return o.default.createElement("div",{className:"messagelist"},o.default.createElement("div",{className:"messages"},o.default.createElement(u.default,{columns:t.columns,messages:n})))}}]),t}();i.propTypes={messages:s.default.arrayOf(s.default.object),folder:s.default.shape({columns:s.default.arrayOf(s.default.string)})},t.default=i},139:
/*!***********************************!*\
  !*** ./src/mymessages/Message.js ***!
  \***********************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=n(/*! react */4),o=i(a),s=i(n(/*! prop-types */8)),u=n(/*! ../global/dataSources */131),l=i(n(/*! ../global/dialogService */69));function i(e){return e&&e.__esModule?e:{default:e}}var c=function(e,t){return{from:t.to,to:t.from,subject:function(e,t){return e+t.subject}(e,t),body:f(t)}},f=function(e){return"\n\n\n\n---------------------------------------\nOriginal message:\nFrom: "+e.from+"\nDate: "+e.date+"\nSubject: "+e.subject+"\n\n"+e.body},d=function(e){function t(e){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var n=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.reply=function(){var e=n.props.message,t=c("Re: ",e);n.stateService.go("mymessages.compose",{message:t})},n.forward=function(){var e=n.props.message,t=c("Fwd: ",e);delete t.to,n.stateService.go("mymessages.compose",{message:t})},n.editDraft=function(){var e=n.props.message;n.stateService.go("mymessages.compose",{message:e})},n.remove=function(){var e=n.props.message,t=n.props.nextMessageGetter(e._id),r=t?"mymessages.messagelist.message":"mymessages.messagelist",a={messageId:t};l.default.confirm("Delete?",void 0).then(function(){return u.MessagesStorage.remove(e)}).then(function(){return n.stateService.go(r,a,{reload:"mymessages.messagelist"})})},n.actions=e.folder.actions.reduce(function(e,t){return e[t]=!0,e},{}),n.stateService=n.props.transition.router.stateService,n}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.Component),r(t,[{key:"componentWillReceiveProps",value:function(e){var t=e.message;t.read=!0,u.MessagesStorage.put(t)}},{key:"render",value:function(){var e=this.props,t=(e.folder,e.message);e.nextMessageGetter;return o.default.createElement("div",{className:"message"},o.default.createElement("div",{className:"header"},o.default.createElement("div",null,o.default.createElement("h4",null,t.subject),o.default.createElement("h5",null,t.from," ",o.default.createElement("i",{className:"fa fa-long-arrow-right"})," ",t.to)),o.default.createElement("div",{className:"line2"},o.default.createElement("div",null,this.actions.edit?o.default.createElement("button",{className:"btn btn-primary",onClick:this.editDraft},o.default.createElement("i",{className:"fa fa-pencil"})," ",o.default.createElement("span",null,"Edit Draft")):null,this.actions.reply?o.default.createElement("button",{className:"btn btn-primary",onClick:this.reply},o.default.createElement("i",{className:"fa fa-reply"})," ",o.default.createElement("span",null,"Reply")):null,this.actions.forward?o.default.createElement("button",{className:"btn btn-primary",onClick:this.forward},o.default.createElement("i",{className:"fa fa-forward"})," ",o.default.createElement("span",null,"Forward")):null,this.actions.delete?o.default.createElement("button",{className:"btn btn-primary",onClick:this.remove},o.default.createElement("i",{className:"fa fa-close"})," ",o.default.createElement("span",null,"Delete")):null))),o.default.createElement("div",{className:"body",dangerouslySetInnerHTML:function(){return{__html:(arguments.length>0&&void 0!==arguments[0]?arguments[0]:"").split(/\n/).map(function(e){return"<p>"+e+"</p>"}).join("\n")}}(t.body)}))}}]),t}();d.propTypes={message:s.default.object,nextMessageGetter:s.default.func,folder:s.default.shape({actions:s.default.arrayOf(s.default.string)})},t.default=d},140:
/*!**************************************!*\
  !*** ./src/mymessages/MyMessages.js ***!
  \**************************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=n(/*! react */4),o=l(a),s=l(n(/*! prop-types */8)),u=n(/*! @uirouter/react */9);function l(e){return e&&e.__esModule?e:{default:e}}var i=function(e){function t(){return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,a.Component),r(t,[{key:"render",value:function(){var e=this.props.folders.map(function(e){return o.default.createElement(u.UISrefActive,{key:e._id,class:"selected"},o.default.createElement("li",{className:"folder"},o.default.createElement(u.UISref,{to:".messagelist",params:{folderId:e._id}},o.default.createElement("a",null,o.default.createElement("i",{className:"fa"}),e._id))))});return o.default.createElement("div",null,o.default.createElement("div",{className:"my-messages"},o.default.createElement("div",{className:"folderlist"},o.default.createElement("ul",{className:"selectlist list-unstyled"},e)),o.default.createElement(u.UIView,{name:"messagelist",className:"messagelist"})),o.default.createElement(u.UIView,{name:"messagecontent"}))}}]),t}();i.propTypes={folders:s.default.arrayOf(s.default.object)},t.default=i},141:
/*!***********************************!*\
  !*** ./src/mymessages/Compose.js ***!
  \***********************************/
/*! no static exports found */
/*! all exports used */
/*! ModuleConcatenation bailout: Module is not an ECMAScript module */function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),o=n(/*! react */4),s=d(o),u=d(n(/*! prop-types */8)),l=n(/*! lodash */132),i=n(/*! ../global/dataSources */131),c=d(n(/*! ../global/appConfig */27)),f=d(n(/*! ../global/dialogService */69));function d(e){return e&&e.__esModule?e:{default:e}}var p=function(e){function t(e){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);var n=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.uiCanExit=function(){if(n.canExit||(0,l.isEqual)(n.pristineMessage,n.state.message))return!0;return f.default.confirm("You have not saved this message.","Navigate away and lose changes?","Yes","No")},n.gotoPreviousState=function(){var e=n.props.transition,t=!!e.from().name,r=t?e.from():"mymessages.messagelist",a=t?e.params("from"):{};e.router.stateService.go(r,a)},n.send=function(){var e=n.state.message;i.MessagesStorage.save(r({},e,{date:new Date,read:!0,folder:"sent"})).then(function(){return n.canExit=!0}).then(function(){return n.gotoPreviousState()})},n.save=function(){var e=n.state.message;i.MessagesStorage.save(r({},e,{date:new Date,read:!0,folder:"drafts"})).then(function(){return n.canExit=!0}).then(function(){return n.gotoPreviousState()})},n.handleChangeMessage=function(e){return function(t){return n.setState({message:r({},n.state.message,(a={},o=e,s=t.target.value,o in a?Object.defineProperty(a,o,{value:s,enumerable:!0,configurable:!0,writable:!0}):a[o]=s,a))});var a,o,s}},n.pristineMessage=r({body:"",to:"",subject:"",from:c.default.emailAddress},n.props.$stateParams.message),n.state={message:r({},n.pristineMessage)},n}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,o.Component),a(t,[{key:"render",value:function(){var e=this.state.message;return s.default.createElement("div",{className:"compose"},s.default.createElement("div",{className:"header"},s.default.createElement("div",{className:"flex-h"}," ",s.default.createElement("label",null,"Recipient")," ",s.default.createElement("input",{type:"text",id:"to",name:"to",value:e.to,onChange:this.handleChangeMessage("to")})," "),s.default.createElement("div",{className:"flex-h"}," ",s.default.createElement("label",null,"Subject")," ",s.default.createElement("input",{type:"text",id:"subject",name:"subject",value:e.subject,onChange:this.handleChangeMessage("subject")})," ")),s.default.createElement("div",{className:"body"},s.default.createElement("textarea",{name:"body",id:"body",value:e.body,cols:"30",rows:"20",onChange:this.handleChangeMessage("body")}),s.default.createElement("div",{className:"buttons"},s.default.createElement("button",{className:"btn btn-primary",onClick:this.gotoPreviousState},s.default.createElement("i",{className:"fa fa-times-circle-o"}),s.default.createElement("span",null,"Cancel")),s.default.createElement("button",{className:"btn btn-primary",onClick:this.save},s.default.createElement("i",{className:"fa fa-save"}),s.default.createElement("span",null,"Save as Draft")),s.default.createElement("button",{className:"btn btn-primary",onClick:this.send},s.default.createElement("i",{className:"fa fa-paper-plane-o"}),s.default.createElement("span",null,"Send")))))}}]),t}();p.propTypes={$stateParams:u.default.shape({message:u.default.object})},t.default=p}}]);
//# sourceMappingURL=2.bundle.js.map