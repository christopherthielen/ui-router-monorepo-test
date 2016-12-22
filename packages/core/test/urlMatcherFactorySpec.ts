import { UrlMatcher, prop, map, find, extend, forEach, isObject, isArray, equals, noop } from "../src/index";
import { UIRouter, UrlMatcherFactory, LocationServices } from "../src/index";
import { TestingPlugin } from "./_testingPlugin";
import { LocationPlugin } from "../src/vanilla/interface";

var router: UIRouter;
var $umf: UrlMatcherFactory;
var $location: LocationServices;

beforeEach(function() {
  router = new UIRouter();
  router.plugin(TestingPlugin);
  $umf = router.urlMatcherFactory;
  let locationPlugin = router.getPlugin('vanilla.memoryLocation') as LocationPlugin;
  $location = locationPlugin.service;
});

describe("UrlMatcher", function () {

  describe("provider", function () {

    it("should factory matchers with correct configuration", function () {
      $umf.caseInsensitive(false);
      expect($umf.compile('/hello').exec('/HELLO')).toBeNull();

      $umf.caseInsensitive(true);
      expect($umf.compile('/hello').exec('/HELLO')).toEqual({});

      $umf.strictMode(true);
      expect($umf.compile('/hello').exec('/hello/')).toBeNull();

      $umf.strictMode(false);
      expect($umf.compile('/hello').exec('/hello/')).toEqual({});
    });

    it("should correctly validate UrlMatcher interface", function () {
      var m = $umf.compile("/");
      expect($umf.isMatcher(m)).toBe(true);

      m = extend({}, m, { validates: null });
      expect($umf.isMatcher(m)).toBe(false);
    });
  });

  it("should match static URLs", function () {
    expect($umf.compile('/hello/world').exec('/hello/world')).toEqual({});
  });

  it("should match static case insensitive URLs", function () {
    expect($umf.compile('/hello/world', { caseInsensitive: true }).exec('/heLLo/World')).toEqual({});
  });

  it("should match against the entire path", function () {
    var matcher = $umf.compile('/hello/world', { strict: true });
    expect(matcher.exec('/hello/world/')).toBeNull();
    expect(matcher.exec('/hello/world/suffix')).toBeNull();
  });

  it("should parse parameter placeholders", function () {
    var matcher = $umf.compile('/users/:id/details/{type}/{repeat:[0-9]+}?from&to');
    expect(matcher.parameters().map(prop('id'))).toEqual(['id', 'type', 'repeat', 'from', 'to']);
  });

  it("should encode and decode duplicate query string values as array", function () {
    var matcher = $umf.compile('/?foo'), array = { foo: ["bar", "baz"] };
    expect(matcher.exec('/', array)).toEqual(array);
    expect(matcher.format(array)).toBe('/?foo=bar&foo=baz');
  });

  describe("snake-case parameters", function() {
    it("should match if properly formatted", function() {
      var matcher = $umf.compile('/users/?from&to&snake-case&snake-case-triple');
      expect(matcher.parameters().map(prop('id'))).toEqual(['from', 'to', 'snake-case', 'snake-case-triple']);
    });

    it("should not match if invalid", function() {
      var err = "Invalid parameter name '-snake' in pattern '/users/?from&to&-snake'";
      expect(function() { $umf.compile('/users/?from&to&-snake'); }).toThrowError(err);

      err = "Invalid parameter name 'snake-' in pattern '/users/?from&to&snake-'";
      expect(function() { $umf.compile('/users/?from&to&snake-'); }).toThrowError(err);
    });
  });

  describe("parameters containing periods", function() {
    it("should match if properly formatted", function() {
      var matcher = $umf.compile('/users/?from&to&with.periods&with.periods.also');
      var params = matcher.parameters().map(function(p) { return p.id; });

      expect(params.sort()).toEqual(['from','to','with.periods','with.periods.also']);
    });

    it("should not match if invalid", function() {
      var err = new Error("Invalid parameter name '.periods' in pattern '/users/?from&to&.periods'");
      expect(function() { $umf.compile('/users/?from&to&.periods'); }).toThrow(err);

      err = new Error("Invalid parameter name 'periods.' in pattern '/users/?from&to&periods.'");
      expect(function() { $umf.compile('/users/?from&to&periods.'); }).toThrow(err);
    });
  });

  describe(".exec()", function() {
    it("should capture parameter values", function () {
      var m = $umf.compile('/users/:id/details/{type}/{repeat:[0-9]+}?from&to', { strict: false });
      expect(m.exec('/users/123/details//0', {})).toEqualData({ id:'123', type:'', repeat:'0'});
    });

    it("should capture catch-all parameters", function () {
      var m = $umf.compile('/document/*path');
      expect(m.exec('/document/a/b/c', {})).toEqual({ path: 'a/b/c' });
      expect(m.exec('/document/', {})).toEqual({ path: '' });
    });

    it("should use the optional regexp with curly brace placeholders", function () {
      var m = $umf.compile('/users/:id/details/{type}/{repeat:[0-9]+}?from&to');
      expect(m.exec('/users/123/details/what/thisShouldBeDigits', {})).toBeNull();
    });

    it("should not use optional regexp for '/'", function () {
      var m = $umf.compile('/{language:(?:fr|en|de)}');
      expect(m.exec('/', {})).toBeNull();
    });

    it("should work with empty default value", function () {
      var m = $umf.compile('/foo/:str', { params: { str: { value: "" } } });
      expect(m.exec('/foo/', {})).toEqual({ str: "" });
    });

    it("should work with empty default value for regex", function () {
      var m = $umf.compile('/foo/{param:(?:foo|bar|)}', { params: { param: { value: "" } } });
      expect(m.exec('/foo/', {})).toEqual({ param: "" });
    });

    it("should treat the URL as already decoded and does not decode it further", function () {
      expect($umf.compile('/users/:id').exec('/users/100%25', {})).toEqual({ id: '100%25'});
    });

    xit('should allow embedded capture groups', function () {
      var shouldPass = {
        "/url/{matchedParam:([a-z]+)}/child/{childParam}": '/url/someword/child/childParam',
        "/url/{matchedParam:([a-z]+)}/child/{childParam}?foo": '/url/someword/child/childParam'
      };

      forEach(shouldPass, function(url, route) {
        expect($umf.compile(route).exec(url, {})).toEqual({
          childParam: "childParam",
          matchedParam: "someword"
        });
      });
    });

    it('should throw on unbalanced capture list', function () {
      var shouldThrow = {
        "/url/{matchedParam:([a-z]+)}/child/{childParam}": '/url/someword/child/childParam',
        "/url/{matchedParam:([a-z]+)}/child/{childParam}?foo": '/url/someword/child/childParam'
      };

      forEach(shouldThrow, function(url, route) {
        expect(function() { $umf.compile(route).exec(url, {}); }).toThrowError(
            "Unbalanced capture group in route '" + route + "'"
        );
      });

      var shouldPass = {
        "/url/{matchedParam:[a-z]+}/child/{childParam}": '/url/someword/child/childParam',
        "/url/{matchedParam:[a-z]+}/child/{childParam}?foo": '/url/someword/child/childParam'
      };

      forEach(shouldPass, function(url, route) {
        expect(function() { $umf.compile(route).exec(url, {}); }).not.toThrow();
      });
    });
  });

  describe(".format()", function() {
    it("should reconstitute the URL", function () {
      var m = $umf.compile('/users/:id/details/{type}/{repeat:[0-9]+}?from'),
          params = { id:'123', type:'default', repeat:444, ignored:'value', from:'1970' };

      expect(m.format(params)).toEqual('/users/123/details/default/444?from=1970');
    });

    it("should encode URL parameters", function () {
      expect($umf.compile('/users/:id').format({ id:'100%'})).toEqual('/users/100%25');
    });

    it("encodes URL parameters with hashes", function () {
      var m = $umf.compile('/users/:id#:section');
      expect(m.format({ id: 'bob', section: 'contact-details' })).toEqual('/users/bob#contact-details');
    });

    it("should trim trailing slashes when the terminal value is optional", function () {
      var config = { params: { id: { squash: true, value: '123' } } },
          m = $umf.compile('/users/:id', config),
          params = { id: '123' };

      expect(m.format(params)).toEqual('/users');
    });

    it("should format query parameters from parent, child, grandchild matchers", function() {
      var m = $umf.compile('/parent?qParent');
      var m2 = m.append($umf.compile('/child?qChild'));
      var m3 = m2.append($umf.compile('/grandchild?qGrandchild'));

      var params = { qParent: 'parent', qChild: 'child', qGrandchild: 'grandchild' };
      var url = '/parent/child/grandchild?qParent=parent&qChild=child&qGrandchild=grandchild';

      var formatted = m3.format(params);
      expect(formatted).toBe(url);
      expect(m3.exec(url.split('?')[0], params)).toEqualData(params);
    })
  });

  describe(".append()", function() {
    it("should append matchers", function () {
      var matcher = $umf.compile('/users/:id/details/{type}?from').append($umf.compile('/{repeat:[0-9]+}?to'));
      var params = matcher.parameters();
      expect(params.map(prop('id'))).toEqual(['id', 'type', 'from', 'repeat', 'to']);
    });

    it("should return a new matcher", function () {
      var base = $umf.compile('/users/:id/details/{type}?from');
      var matcher = base.append($umf.compile('/{repeat:[0-9]+}?to'));
      expect(matcher).not.toBe(base);
    });

    it("should respect $urlMatcherFactoryProvider.strictMode", function() {
      var m = $umf.compile('/');
      $umf.strictMode(false);
      m = m.append($umf.compile("foo"));
      expect(m.exec("/foo")).toEqual({});
      expect(m.exec("/foo/")).toEqual({})
    });

    it("should respect $urlMatcherFactoryProvider.caseInsensitive", function() {
      var m = $umf.compile('/');
      $umf.caseInsensitive(true);
      m = m.append($umf.compile("foo"));
      expect(m.exec("/foo")).toEqual({});
      expect(m.exec("/FOO")).toEqual({});
    });

    it("should respect $urlMatcherFactoryProvider.caseInsensitive when validating regex params", function() {
      var m = $umf.compile('/');
      $umf.caseInsensitive(true);
      m = m.append($umf.compile("foo/{param:bar}"));
      expect(m.validates({ param: 'BAR' })).toEqual(true);
    });

    it("should generate/match params in the proper order", function() {
      var m = $umf.compile('/foo?queryparam');
      m = m.append($umf.compile("/bar/:pathparam"));
      expect(m.exec("/foo/bar/pathval", { queryparam: "queryval" })).toEqual({
        pathparam: "pathval",
        queryparam: "queryval"
      });
    });
  });


  describe("multivalue-query-parameters", function() {
    it("should handle .is() for an array of values", function () {
      var m = $umf.compile('/foo?{param1:int}'), param = m.parameter('param1');
      expect(param.type.is([1, 2, 3])).toBe(true);
      expect(param.type.is([1, "2", 3])).toBe(false);
    });

    it("should handle .equals() for two arrays of values", function () {
      var m = $umf.compile('/foo?{param1:int}&{param2:date}'),
          param1 = m.parameter('param1'),
          param2 = m.parameter('param2');

      expect(param1.type.equals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(param1.type.equals([1, 2, 3], [1, 2])).toBe(false);
      expect(param2.type.equals(
          [new Date(2014, 11, 15), new Date(2014, 10, 15)],
          [new Date(2014, 11, 15), new Date(2014, 10, 15)])
      ).toBe(true);
      expect(param2.type.equals(
          [new Date(2014, 11, 15), new Date(2014, 9, 15)],
          [new Date(2014, 11, 15), new Date(2014, 10, 15)])
      ).toBe(false);
    });

    it("should conditionally be wrapped in an array by default", function () {
      var m = $umf.compile('/foo?param1');

      // empty array [] is treated like "undefined"
      expect(m.format({ param1: undefined })).toBe("/foo");
      expect(m.format({ param1: [] })).toBe("/foo");
      expect(m.format({ param1: "" })).toBe("/foo");
      expect(m.format({ param1: "1" })).toBe("/foo?param1=1");
      expect(m.format({ param1: ["1"] })).toBe("/foo?param1=1");
      expect(m.format({ param1: ["1", "2"] })).toBe("/foo?param1=1&param1=2");

      expect(m.exec("/foo")).toEqual({ param1: undefined });
      expect(m.exec("/foo", {})).toEqual({ param1: undefined });
      expect(m.exec("/foo", { param1: "" })).toEqual({ param1: undefined });
      expect(m.exec("/foo", { param1: "1" })).toEqual({ param1: "1" }); // auto unwrap single values
      expect(m.exec("/foo", { param1: ["1", "2"] })).toEqual({ param1: ["1", "2"] });

      $location.setUrl("/foo");
      expect(m.exec($location.path(), $location.search())).toEqual({ param1: undefined });
      $location.setUrl("/foo?param1=bar");
      expect(m.exec($location.path(), $location.search())).toEqual({ param1: 'bar' }); // auto unwrap
      $location.setUrl("/foo?param1=");
      expect(m.exec($location.path(), $location.search())).toEqual({ param1: undefined });
      $location.setUrl("/foo?param1=bar&param1=baz");
      expect(m.exec($location.path(), $location.search())).toEqual({ param1: ['bar', 'baz'] });

      expect(m.format({})).toBe("/foo");
      expect(m.format({ param1: undefined })).toBe("/foo");
      expect(m.format({ param1: "" })).toBe("/foo");
      expect(m.format({ param1: 'bar' })).toBe("/foo?param1=bar");
      expect(m.format({ param1: ['bar'] })).toBe("/foo?param1=bar");
      expect(m.format({ param1: ['bar', 'baz'] })).toBe("/foo?param1=bar&param1=baz");

    });

    it("should be wrapped in an array if array: true", function () {
      var m = $umf.compile('/foo?param1', { params: { param1: { array: true } } });

      // empty array [] is treated like "undefined"
      expect(m.format({ param1: undefined })).toBe("/foo");
      expect(m.format({ param1: [] })).toBe("/foo");
      expect(m.format({ param1: "" })).toBe("/foo");
      expect(m.format({ param1: "1" })).toBe("/foo?param1=1");
      expect(m.format({ param1: ["1"] })).toBe("/foo?param1=1");
      expect(m.format({ param1: ["1", "2"] })).toBe("/foo?param1=1&param1=2");

      expect(m.exec("/foo")).toEqual({ param1: undefined });
      expect(m.exec("/foo", {})).toEqual({ param1: undefined });
      expect(m.exec("/foo", { param1: "" })).toEqual({ param1: undefined });
      expect(m.exec("/foo", { param1: "1" })).toEqual({ param1: ["1"] });
      expect(m.exec("/foo", { param1: ["1", "2"] })).toEqual({ param1: ["1", "2"] });

      $location.setUrl("/foo");
      expect(m.exec($location.path(), $location.search())).toEqual({ param1: undefined });
      $location.setUrl("/foo?param1=");
      expect(m.exec($location.path(), $location.search())).toEqual({ param1: undefined });
      $location.setUrl("/foo?param1=bar");
      expect(m.exec($location.path(), $location.search())).toEqual({ param1: ['bar'] });
      $location.setUrl("/foo?param1=bar&param1=baz");
      expect(m.exec($location.path(), $location.search())).toEqual({ param1: ['bar', 'baz'] });

      expect(m.format({})).toBe("/foo");
      expect(m.format({ param1: undefined })).toBe("/foo");
      expect(m.format({ param1: "" })).toBe("/foo");
      expect(m.format({ param1: 'bar' })).toBe("/foo?param1=bar");
      expect(m.format({ param1: ['bar'] })).toBe("/foo?param1=bar");
      expect(m.format({ param1: ['bar', 'baz'] })).toBe("/foo?param1=bar&param1=baz");
    });

    it("should be wrapped in an array if paramname looks like param[]", function () {
      var m = $umf.compile('/foo?param1[]');

      expect(m.exec("/foo")).toEqualData({});

      $location.setUrl("/foo?param1[]=bar");
      expect(m.exec($location.path(), $location.search())).toEqual({ "param1[]": ['bar'] });
      expect(m.format({ "param1[]": 'bar' })).toBe("/foo?param1[]=bar");
      expect(m.format({ "param1[]": ['bar'] })).toBe("/foo?param1[]=bar");

      $location.setUrl("/foo?param1[]=bar&param1[]=baz");
      expect(m.exec($location.path(), $location.search())).toEqual({ "param1[]": ['bar', 'baz'] });
      expect(m.format({ "param1[]": ['bar', 'baz'] })).toBe("/foo?param1[]=bar&param1[]=baz");
    });

    // Test for issue #2222
    it("should return default value, if query param is missing.", function() {
      var m = $umf.compile('/state?param1&param2&param3&param5', {
        params: {
          param1 : 'value1',
          param2 : {array: true, value: ['value2']},
          param3 : {array: true, value: []},
          param5 : {array: true, value: function() {return [];}}
        }
      });

      var expected = {
        "param1": 'value1',
        "param2": ['value2'],
        "param3": [],
        "param5": []
      };

      // Parse url to get Param.value()
      var parsed = m.exec("/state");
      expect(parsed).toEqualData(expected);

      // Pass again through Param.value() for normalization (like transitionTo)
      var paramDefs = m.parameters();
      var values = map(parsed, function(val, key) {
        return find(paramDefs, function(def) { return def.id === key }).value(val);
      });
      expect(values).toEqualData(expected);
    });

    it("should not be wrapped by ui-router into an array if array: false", (function() {
      var m = $umf.compile('/foo?param1', { params: { param1: { array: false } } });

      expect(m.exec("/foo")).toEqualData({});

      $location.setUrl("/foo?param1=bar");
      expect(m.exec($location.path(), $location.search())).toEqual( { param1: 'bar' } );
      expect(m.format({ param1: 'bar' })).toBe("/foo?param1=bar");
      expect(m.format({ param1: [ 'bar' ] })).toBe("/foo?param1=bar");

      $location.setUrl("/foo?param1=bar&param1=baz");
      expect(m.exec($location.path(), $location.search())).toEqual( { param1: 'bar,baz' } ); // coerced to string
      expect(m.format({ param1: ['bar', 'baz'] })).toBe("/foo?param1=bar%2Cbaz"); // coerced to string
    }));
  });

  describe("multivalue-path-parameters", function() {
    it("should behave as a single-value by default", (function() {
      var m = $umf.compile('/foo/:param1');

      expect(m.exec("/foo/")).toEqual({ param1: ""});

      expect(m.exec("/foo/bar")).toEqual( { param1: 'bar' } );
      expect(m.format({ param1: 'bar' })).toBe("/foo/bar");
      expect(m.format({ param1: ['bar', 'baz'] })).toBe("/foo/bar%2Cbaz"); // coerced to string
    }));

    it("should be split on - in url and wrapped in an array if array: true", (function() {
      var m = $umf.compile('/foo/:param1', { params: { param1: { array: true } } });

      expect(m.exec("/foo/")).toEqual({ param1: undefined });
      expect(m.exec("/foo/bar")).toEqual({ param1: [ "bar" ] });
      $location.setUrl("/foo/bar-baz");
      expect(m.exec($location.path())).toEqual({ param1: [ "bar", "baz" ] });

      expect(m.format({ param1: [] })).toEqual("/foo/");
      expect(m.format({ param1: [ 'bar' ] })).toEqual("/foo/bar");
      expect(m.format({ param1: [ 'bar', 'baz' ] })).toEqual("/foo/bar-baz");
    }));

    it("should behave similar to multi-value query params", (function() {
      var m = $umf.compile('/foo/:param1[]');

      // empty array [] is treated like "undefined"
      expect(m.format({ "param1[]": undefined })).toBe("/foo/");
      expect(m.format({ "param1[]": [] })).toBe("/foo/");
      expect(m.format({ "param1[]": "" })).toBe("/foo/");
      expect(m.format({ "param1[]": "1" })).toBe("/foo/1");
      expect(m.format({ "param1[]": [ "1" ] })).toBe("/foo/1");
      expect(m.format({ "param1[]": [ "1", "2" ] })).toBe("/foo/1-2");

      expect(m.exec("/foo/")).toEqual({ "param1[]": undefined });
      expect(m.exec("/foo/1")).toEqual({ "param1[]": [ "1" ] });
      expect(m.exec("/foo/1-2")).toEqual({ "param1[]": [ "1", "2" ] });

      $location.setUrl("/foo/");
      expect(m.exec($location.path(), $location.search())).toEqual( { "param1[]": undefined } );
      $location.setUrl("/foo/bar");
      expect(m.exec($location.path(), $location.search())).toEqual( { "param1[]": [ 'bar' ] } );
      $location.setUrl("/foo/bar-baz");
      expect(m.exec($location.path(), $location.search())).toEqual( { "param1[]": ['bar', 'baz'] } );

      expect(m.format({ })).toBe("/foo/");
      expect(m.format({ "param1[]": undefined })).toBe("/foo/");
      expect(m.format({ "param1[]": "" })).toBe("/foo/");
      expect(m.format({ "param1[]": 'bar' })).toBe("/foo/bar");
      expect(m.format({ "param1[]": [ 'bar' ] })).toBe("/foo/bar");
      expect(m.format({ "param1[]": ['bar', 'baz'] })).toBe("/foo/bar-baz");
    }));

    it("should be split on - in url and wrapped in an array if paramname looks like param[]", (function() {
      var m = $umf.compile('/foo/:param1[]');

      expect(m.exec("/foo/")).toEqual({ "param1[]": undefined });
      expect(m.exec("/foo/bar")).toEqual({ "param1[]": [ "bar" ] });
      expect(m.exec("/foo/bar-baz")).toEqual({ "param1[]": [ "bar", "baz" ] });

      expect(m.format({ "param1[]": [] })).toEqual("/foo/");
      expect(m.format({ "param1[]": [ 'bar' ] })).toEqual("/foo/bar");
      expect(m.format({ "param1[]": [ 'bar', 'baz' ] })).toEqual("/foo/bar-baz");
    }));

    it("should allow path param arrays with '-' in the values", (function() {
      var m = $umf.compile('/foo/:param1[]');

      expect(m.exec("/foo/")).toEqual({ "param1[]": undefined });
      expect(m.exec("/foo/bar\\-")).toEqual({ "param1[]": [ "bar-" ] });
      expect(m.exec("/foo/bar\\--\\-baz")).toEqual({ "param1[]": [ "bar-", "-baz" ] });

      expect(m.format({ "param1[]": [] })).toEqual("/foo/");
      expect(m.format({ "param1[]": [ 'bar-' ] })).toEqual("/foo/bar%5C%2D");
      expect(m.format({ "param1[]": [ 'bar-', '-baz' ] })).toEqual("/foo/bar%5C%2D-%5C%2Dbaz");
      expect(m.format({ "param1[]": [ 'bar-bar-bar-', '-baz-baz-baz' ] }))
          .toEqual("/foo/bar%5C%2Dbar%5C%2Dbar%5C%2D-%5C%2Dbaz%5C%2Dbaz%5C%2Dbaz");
    }));

    // xit("should handle angular 1 $location.url encode/decodes correctly", (function() {
    //   var m = $umf.compile('/foo/:param1[]');
    //
    //   $location.setUrl(m.format({ "param1[]": [ 'bar-', '-baz' ] }));
    //   expect(m.exec($location.path(), $location.search())).toEqual({ "param1[]": [ 'bar-', '-baz' ] });
    //
    //   // check that we handle $location.url decodes correctly for multiple hyphens
    //   $location.setUrl(m.format({ "param1[]": [ 'bar-bar-bar-', '-baz-baz-baz' ] }));
    //   expect(m.exec($location.path(), $location.search())).toEqual({ "param1[]": [ 'bar-bar-bar-', '-baz-baz-baz' ] });
    //
    //   // check that pre-encoded values are passed correctly
    //   $location.setUrl(m.format({ "param1[]": [ '%2C%20%5C%2C', '-baz' ] }));
    //   expect(m.exec($location.path(), $location.search())).toEqual({ "param1[]": [ '%2C%20%5C%2C', '-baz' ] });
    // }));
  });
});

describe("urlMatcherFactoryProvider", function () {
  describe(".type()", function () {
    var m;
    beforeEach(function() {
      $umf.type("myType", {} as any, function() {
        return {
          decode: function() { return { status: 'decoded' }; },
          is: isObject
        } as any;
      });
      m = $umf.compile("/test?{foo:myType}");
    });

    it("should handle arrays properly with config-time custom type definitions", function () {
      expect(m.exec("/test", { foo: '1' })).toEqual({ foo: { status: 'decoded' } });
      expect(m.exec("/test", { foo: ['1', '2'] })).toEqual({ foo: [{ status: 'decoded' }, { status: 'decoded' }] });
    });
  });

  // TODO: Fix object pollution between tests for urlMatcherConfig
  afterEach(function () {
    $umf.caseInsensitive(false);
  });
});

describe("urlMatcherFactory", function () {

  it("compiles patterns", function () {
    var matcher = $umf.compile('/hello/world');
    expect(matcher instanceof UrlMatcher).toBe(true);
  });

  it("recognizes matchers", function () {
    expect($umf.isMatcher($umf.compile('/'))).toBe(true);

    var custom = {
      format:     noop,
      exec:       noop,
      append:     noop,
      isRoot:     noop,
      validates:  noop,
      parameters: noop,
      parameter:  noop
    };
    expect($umf.isMatcher(custom)).toBe(true);
  });

  it("should handle case sensitive URL by default", function () {
    expect($umf.compile('/hello/world').exec('/heLLo/WORLD')).toBeNull();
  });

  it("should handle case insensitive URL", function () {
    $umf.caseInsensitive(true);
    expect($umf.compile('/hello/world').exec('/heLLo/WORLD')).toEqual({});
  });

  describe("typed parameters", function() {
    it("should accept object definitions", function () {
      var type = { encode: function() {}, decode: function() {} };
      $umf.type("myType1", type as any);
      expect($umf.type("myType1").encode).toBe(type.encode);
    });

    it("should reject duplicate definitions", function () {
      $umf.type("myType2", { encode: function () {}, decode: function () {} } as any);
      expect(function() { $umf.type("myType2", {} as any); }).toThrowError("A type named 'myType2' has already been defined.");
    });

    // consider if this feature should remain or be removed
    // it("should accept injected function definitions", inject(function ($stateParams) {
    //   provider.type("myType3", {}, function($stateParams) {
    //     return {
    //       decode: function() {
    //         return $stateParams;
    //       }
    //     };
    //   });
    //   expect(provider.type("myType3").decode()).toBe($stateParams);
    // }));
    //
    // consider if this feature should remain or be removed
    // it("should accept annotated function definitions", inject(function ($stateParams) {
    //   provider.type("myAnnotatedType", {},['$stateParams', function(s) {
    //     return {
    //       decode: function() {
    //         return s;
    //       }
    //     };
    //   }]);
    //   expect(provider.type("myAnnotatedType").decode()).toBe($stateParams);
    // }));

    it("should match built-in types", function () {
      var m = $umf.compile("/{foo:int}/{flag:bool}");
      expect(m.exec("/1138/1")).toEqual({ foo: 1138, flag: true });
      expect(m.format({ foo: 5, flag: true })).toBe("/5/1");

      expect(m.exec("/-1138/1")).toEqual({ foo: -1138, flag: true });
      expect(m.format({ foo: -5, flag: true })).toBe("/-5/1");
    });

    it("should match built-in types with spaces", function () {
      var m = $umf.compile("/{foo: int}/{flag:  bool}");
      expect(m.exec("/1138/1")).toEqual({ foo: 1138, flag: true });
      expect(m.format({ foo: 5, flag: true })).toBe("/5/1");
    });

    it("should not throw on null value", function () {
      var m = $umf.compile("/{foo:int}");
      expect(m.exec("/1138")).toEqual({ foo: 1138 });
      expect(m.format({ foo: null })).toBe(null);

      m = $umf.compile("/{foo:int}", { params: { foo: { value: 1 } } });
      expect(m.format({ foo: null })).toBe("/1");
    });

    it("should match types named only in params", function () {
      var m = $umf.compile("/{foo}/{flag}", {
        params: {
          foo: { type: 'int'},
          flag: { type: 'bool'}
        }
      });
      expect(m.exec("/1138/1")).toEqual({ foo: 1138, flag: true });
      expect(m.format({ foo: 5, flag: true })).toBe("/5/1");
    });

    it("should throw an error if a param type is declared twice", function () {
      expect(function() {
        $umf.compile("/{foo:int}", {
          params: {
            foo: { type: 'int' }
          }
        });
      }).toThrow(new Error("Param 'foo' has two type configurations."));
    });

    it("should encode/decode dates", function () {
      var m = $umf.compile("/calendar/{date:date}"),
          result = m.exec("/calendar/2014-03-26");
      var date = new Date(2014, 2, 26);

      expect(result['date'] instanceof Date).toBe(true);
      expect(result['date'].toUTCString()).toEqual(date.toUTCString());
      expect(m.format({ date: date })).toBe("/calendar/2014-03-26");
    });

    it("should encode/decode arbitrary objects to json", function () {
      var m = $umf.compile("/state/{param1:json}/{param2:json}");

      var params = {
        param1: { foo: 'huh', count: 3 },
        param2: { foo: 'wha', count: 5 }
      };

      var json1 = '{"foo":"huh","count":3}';
      var json2 = '{"foo":"wha","count":5}';

      expect(m.format(params)).toBe("/state/" + encodeURIComponent(json1) + "/" + encodeURIComponent(json2));
      expect(m.exec("/state/" + json1 + "/" + json2)).toEqual(params);
    });

    it("should not match invalid typed parameter values", function() {
      var m = $umf.compile('/users/{id:int}');

      expect(m.exec('/users/1138')['id']).toBe(1138);
      expect(m.exec('/users/alpha')).toBeNull();

      expect(m.format({ id: 1138 })).toBe("/users/1138");
      expect(m.format({ id: "alpha" })).toBeNull();
    });

    it("should automatically handle multiple search param values", (function() {
      var m = $umf.compile("/foo/{fooid:int}?{bar:int}");

      $location.setUrl("/foo/5?bar=1");
      expect(m.exec($location.path(), $location.search())).toEqual( { fooid: 5, bar: 1 } );
      expect(m.format({ fooid: 5, bar: 1 })).toEqual("/foo/5?bar=1");

      $location.setUrl("/foo/5?bar=1&bar=2&bar=3");
      expect(m.exec($location.path(), $location.search())).toEqual( { fooid: 5, bar: [ 1, 2, 3 ] } );
      expect(m.format({ fooid: 5, bar: [ 1, 2, 3 ] })).toEqual("/foo/5?bar=1&bar=2&bar=3");

      m.format()
    }));

    it("should allow custom types to handle multiple search param values manually", (function() {
      $umf.type("custArray", {
        encode: function(array)  { return array.join("-"); },
        decode: function(val) { return isArray(val) ? val : val.split(/-/); },
        equals: equals,
        is: isArray
      } as any);

      var m = $umf.compile("/foo?{bar:custArray}", { params: { bar: { array: false } } } );

      $location.setUrl("/foo?bar=fox");
      expect(m.exec($location.path(), $location.search())).toEqual( { bar: [ 'fox' ] } );
      expect(m.format({ bar: [ 'fox' ] })).toEqual("/foo?bar=fox");

      $location.setUrl("/foo?bar=quick-brown-fox");
      expect(m.exec($location.path(), $location.search())).toEqual( { bar: [ 'quick', 'brown', 'fox' ] } );
      expect(m.format({ bar: [ 'quick', 'brown', 'fox' ] })).toEqual("/foo?bar=quick-brown-fox");
    }));
  });

  describe("optional parameters", function() {
    it("should match with or without values", function () {
      var m = $umf.compile('/users/{id:int}', {
        params: { id: { value: null, squash: true } }
      });
      expect(m.exec('/users/1138')).toEqual({ id: 1138 });
      expect(m.exec('/users1138')).toBeNull();
      expect(m.exec('/users/')['id']).toBeNull();
      expect(m.exec('/users')['id']).toBeNull();
    });

    it("should correctly match multiple", function() {
      var m = $umf.compile('/users/{id:int}/{state:[A-Z]+}', {
        params: { id: { value: null, squash: true }, state: { value: null, squash: true } }
      });
      expect(m.exec('/users/1138')).toEqual({ id: 1138, state: null });
      expect(m.exec('/users/1138/NY')).toEqual({ id: 1138, state: "NY" });

      expect(m.exec('/users/')['id']).toBeNull();
      expect(m.exec('/users/')['state']).toBeNull();

      expect(m.exec('/users')['id']).toBeNull();
      expect(m.exec('/users')['state']).toBeNull();

      expect(m.exec('/users/NY')['state']).toBe("NY");
      expect(m.exec('/users/NY')['id']).toBeNull();
    });

    it("should correctly format with or without values", function() {
      var m = $umf.compile('/users/{id:int}', {
        params: { id: { value: null } }
      });
      expect(m.format()).toBe('/users/');
      expect(m.format({ id: 1138 })).toBe('/users/1138');
    });

    it("should correctly format multiple", function() {
      var m = $umf.compile('/users/{id:int}/{state:[A-Z]+}', {
        params: { id: { value: null, squash: true }, state: { value: null, squash: true } }
      });

      expect(m.format()).toBe("/users");
      expect(m.format({ id: 1138 })).toBe("/users/1138");
      expect(m.format({ state: "NY" })).toBe("/users/NY");
      expect(m.format({ id: 1138, state: "NY" })).toBe("/users/1138/NY");
    });

    it("should match in between static segments", function() {
      var m = $umf.compile('/users/{user:int}/photos', {
        params: { user: { value: 5, squash: true } }
      });
      expect(m.exec('/users/photos')['user']).toBe(5);
      expect(m.exec('/users/6/photos')['user']).toBe(6);
      expect(m.format()).toBe("/users/photos");
      expect(m.format({ user: 1138 })).toBe("/users/1138/photos");
    });

    it("should correctly format with an optional followed by a required parameter", function() {
      var m = $umf.compile('/home/:user/gallery/photos/:photo', {
        params: {
          user: {value: null, squash: true},
          photo: undefined
        }
      });
      expect(m.format({ photo: 12 })).toBe("/home/gallery/photos/12");
      expect(m.format({ user: 1138, photo: 13 })).toBe("/home/1138/gallery/photos/13");
    });

    describe("default values", function() {
      it("should populate if not supplied in URL", function() {
        var m = $umf.compile('/users/{id:int}/{test}', {
          params: { id: { value: 0, squash: true }, test: { value: "foo", squash: true } }
        });
        expect(m.exec('/users')).toEqual({ id: 0, test: "foo" });
        expect(m.exec('/users/2')).toEqual({ id: 2, test: "foo" });
        expect(m.exec('/users/bar')).toEqual({ id: 0, test: "bar" });
        expect(m.exec('/users/2/bar')).toEqual({ id: 2, test: "bar" });
        expect(m.exec('/users/bar/2')).toBeNull();
      });

      it("should populate even if the regexp requires 1 or more chars", function() {
        var m = $umf.compile('/record/{appId}/{recordId:[0-9a-fA-F]{10,24}}', {
          params: { appId: null, recordId: null }
        });
        expect(m.exec("/record/546a3e4dd273c60780e35df3/"))
            .toEqual({ appId: "546a3e4dd273c60780e35df3", recordId: null });
      });

      it("should allow shorthand definitions", function() {
        var m = $umf.compile('/foo/:foo', {
          params: { foo: "bar" }
        });
        expect(m.exec("/foo/")).toEqual({ foo: "bar" });
      });

      it("should populate query params", function() {
        var defaults = { order: "name", limit: 25, page: 1 };
        var m = $umf.compile('/foo?order&{limit:int}&{page:int}', {
          params: defaults
        });
        expect(m.exec("/foo")).toEqual(defaults);
      });

      it("should allow function-calculated values", function() {
        function barFn() { return "Value from bar()"; }
        var m = $umf.compile('/foo/:bar', {
          params: { bar: barFn }
        });
        expect(m.exec('/foo/')['bar']).toBe("Value from bar()");

        m = $umf.compile('/foo/:bar', {
          params: { bar: { value: barFn, squash: true } }
        });
        expect(m.exec('/foo')['bar']).toBe("Value from bar()");

        m = $umf.compile('/foo?bar', {
          params: { bar: barFn }
        });
        expect(m.exec('/foo')['bar']).toBe("Value from bar()");
      });

      // consider if this feature should remain or be removed
      // it("should allow injectable functions", inject(function($stateParams) {
      //   var m = $umf.compile('/users/{user:json}', {
      //     params: {
      //       user: function($stateParams) {
      //         return $stateParams.user;
      //       }
      //     }
      //   });
      //   var user = { name: "Bob" };
      //
      //   $stateParams.user = user;
      //   expect(m.exec('/users/').user).toBe(user);
      // }));

      xit("should match when used as prefix", function() {
        var m = $umf.compile('/{lang:[a-z]{2}}/foo', {
          params: { lang: "de" }
        });
        expect(m.exec('/de/foo')).toEqual({ lang: "de" });
        expect(m.exec('/foo')).toEqual({ lang: "de" });
      });

      describe("squash policy", function() {
        var Session = { username: "loggedinuser" };
        function getMatcher(squash) {
          return $umf.compile('/user/:userid/gallery/:galleryid/photo/:photoid', {
            params: {
              userid: { squash: squash, value: function () { return Session.username; } },
              galleryid: { squash: squash, value: "favorites" }
            }
          });
        }

        it(": true should squash the default value and one slash", function () {
          var m = getMatcher(true);

          var defaultParams = { userid: 'loggedinuser', galleryid: 'favorites', photoid: '123' };
          expect(m.exec('/user/gallery/photo/123')).toEqual(defaultParams);
          expect(m.exec('/user//gallery//photo/123')).toEqual(defaultParams);
          expect(m.format(defaultParams)).toBe('/user/gallery/photo/123');

          var nonDefaultParams = { userid: 'otheruser', galleryid: 'travel', photoid: '987' };
          expect(m.exec('/user/otheruser/gallery/travel/photo/987')).toEqual(nonDefaultParams);
          expect(m.format(nonDefaultParams)).toBe('/user/otheruser/gallery/travel/photo/987');
        });

        it(": false should not squash default values", function () {
          var m = getMatcher(false);

          var defaultParams = { userid: 'loggedinuser', galleryid: 'favorites', photoid: '123' };
          expect(m.exec('/user/loggedinuser/gallery/favorites/photo/123')).toEqual(defaultParams);
          expect(m.format(defaultParams)).toBe('/user/loggedinuser/gallery/favorites/photo/123');

          var nonDefaultParams = { userid: 'otheruser', galleryid: 'travel', photoid: '987' };
          expect(m.exec('/user/otheruser/gallery/travel/photo/987')).toEqual(nonDefaultParams);
          expect(m.format(nonDefaultParams)).toBe('/user/otheruser/gallery/travel/photo/987');
        });

        it(": '' should squash the default value to an empty string", function () {
          var m = getMatcher("");

          var defaultParams = { userid: 'loggedinuser', galleryid: 'favorites', photoid: '123' };
          expect(m.exec('/user//gallery//photo/123')).toEqual(defaultParams);
          expect(m.format(defaultParams)).toBe('/user//gallery//photo/123');

          var nonDefaultParams = { userid: 'otheruser', galleryid: 'travel', photoid: '987' };
          expect(m.exec('/user/otheruser/gallery/travel/photo/987')).toEqual(nonDefaultParams);
          expect(m.format(nonDefaultParams)).toBe('/user/otheruser/gallery/travel/photo/987');
        });

        it(": '~' should squash the default value and replace it with '~'", function () {
          var m = getMatcher("~");

          var defaultParams = { userid: 'loggedinuser', galleryid: 'favorites', photoid: '123' };
          expect(m.exec('/user//gallery//photo/123')).toEqual(defaultParams);
          expect(m.exec('/user/~/gallery/~/photo/123')).toEqual(defaultParams);
          expect(m.format(defaultParams)).toBe('/user/~/gallery/~/photo/123');

          var nonDefaultParams = { userid: 'otheruser', galleryid: 'travel', photoid: '987' };
          expect(m.exec('/user/otheruser/gallery/travel/photo/987')).toEqual(nonDefaultParams);
          expect(m.format(nonDefaultParams)).toBe('/user/otheruser/gallery/travel/photo/987');
        });
      });
    });
  });

  describe("strict matching", function() {
    it("should match with or without trailing slash", function() {
      var m = $umf.compile('/users', { strict: false });
      expect(m.exec('/users')).toEqual({});
      expect(m.exec('/users/')).toEqual({});
    });

    it("should not match multiple trailing slashes", function() {
      var m = $umf.compile('/users', { strict: false });
      expect(m.exec('/users//')).toBeNull();
    });

    it("should match when defined with parameters", function() {
      var m = $umf.compile('/users/{name}', { strict: false, params: {
        name: { value: null }
      }});
      expect(m.exec('/users/')).toEqual({ name: null });
      expect(m.exec('/users/bob')).toEqual({ name: "bob" });
      expect(m.exec('/users/bob/')).toEqual({ name: "bob" });
      expect(m.exec('/users/bob//')).toBeNull();
    });
  });

  // This feature never made it into 1.0
  // xdescribe("parameter isolation", function() {
  //   it("should allow parameters of the same name in different segments", function() {
  //     var m = $umf.compile('/users/:id').append($umf.compile('/photos/:id'));
  //     expect(m.exec('/users/11/photos/38', {}, { isolate: true })).toEqual([{ id: '11' }, { id: '38' }]);
  //   });
  //
  //   it("should prioritize the last child when non-isolated", function() {
  //     var m = $umf.compile('/users/:id').append($umf.compile('/photos/:id'));
  //     expect(m.exec('/users/11/photos/38')).toEqual({ id: '38' });
  //   });
  //
  //   it("should copy search parameter values to all matching segments", function() {
  //     var m = $umf.compile('/users/:id?from').append($umf.compile('/photos/:id?from'));
  //     var result = m.exec('/users/11/photos/38', { from: "bob" }, { isolate: true });
  //     expect(result).toEqual([{ from: "bob", id: "11" }, { from: "bob", id: "38" }]);
  //   });
  //
  //   it("should pair empty objects with static segments", function() {
  //     var m = $umf.compile('/users/:id').append($umf.compile('/foo')).append($umf.compile('/photos/:id'));
  //     var result = m.exec('/users/11/foo/photos/38', {}, { isolate: true });
  //     expect(result).toEqual([{ id: '11' }, {}, { id: '38' }]);
  //   });
  // });
});
