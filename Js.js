!function() {
	'use strict';
	
	window.js = function(value) {
	};
	
	js.Undefined = js.Void = void 0;
	js.ToArray = Array.prototype.from || (value => Array.prototype.slice.call(value));
	js.ToInt = value => +value || 0;
	
	js.HardMixin = properties => target => Object.keys(properties).reduce(
		(target, key) => (target[key] = properties[key], target), target
	);
	js.SoftMixin = properties => target => Object.keys(properties).reduce(
		(target, key) => (!target.hasOwnProperty(key) && (target[key] = properties[key]), target), target
	);
	js.Mixin = (properties, force) => js[['Soft', 'Hard'][+force] + 'Mixin'](properties);
	
	js.Class = constructor => fields => methods => {
		if(typeof constructor !== 'function')
			throw new TypeError('the constructor of a class must be a function');
		constructor.prototype || (constructor.prototype = {});
		js.SoftMixin(methods)(constructor.prototype);
		let _ = function() {
			let instance = js.HardMixin(fields)({});
			constructor.apply(instance, arguments);
			instance.__proto__ = methods;
			return instance;
		};
		_.origin = js.Class;
		_.fields = fields;
		_.methods = methods;
		_.prototype = methods;
		return _;
	};
	js.Class.origin = js.Class.constructor = js.Class;
	
	js.Derive = origin => constructor => fields => methods => {
		fields && js.SoftMixin(origin.fields)(fields);
		methods && js.SoftMixin(origin.prototype)(methods);
		let _ = function() {
			let instance = origin.apply(null, arguments);
			constructor.apply(instance, arguments);
			instance.__proto__ = methods;
			return js.SoftMixin(fields)(instance);
		};
		_.origin = origin;
		_.prototype = methods;
		return _;
	};
	
	js.IsInstanceOf = constructor => target => {
		if(target instanceof constructor)
			return true;
		let prototype = constructor.prototype;
		
		let Check = key => target => target.hasOwnProperty(key);
		return !Object.keys(prototype).some(key => {
			let CheckKey = Check(key);
			return CheckKey(prototype) && !(CheckKey(target) || CheckKey(target.__proto__))
		});
	};
	
	js.TypeName = value => {
		if(value === null)
			return 'null';
		if(Object.prototype.toString.call(value) === '[object Array]')
			return 'array';
		let typename = typeof value;
		if(typename !== 'object')
			return typename;
		let str = value.constructor.toString();
		let name = str.slice(9, str.indexOf('('));
		return name || typename;
	};
	
	js.IsPrimitive = value => {
		switch(js.TypeName(value)) {
			case 'number':
			case 'string':
			case 'RegExp':
			case 'undefined':
			case 'null':
				return true;
			default:
				return false;
		}
	};
	
	const Equal = (a, stack_a) => (b, stack_b) => {
		let type = js.TypeName(a);
		if(type !== js.TypeName(b))
			return false;
		if(js.IsPrimitive(a)) {
			switch(type) {
				case 'number':
					return a !== a ? b !== b : 1 / a === 1 / b;
				case 'string':
				case 'RegExp':
					return a + '' === b + '';
				case 'undefined':
				case 'null':
					return a === b;
			}
		} else {
			if(type === 'function')
				return a === b;
			for(let key in a) if(a.hasOwnProperty(key)) {
				let a_current = a[key], b_current = b[key];
				if(js.IsPrimitive(a_current)) {
					if(Equal(a_current, [])(b_current, []))
						continue;
					else
						return false;
				}
				for(let i = 0, length = stack_a.length; i < length; ++i)
					if(stack_a[i] === a_current)
						return stack_b[i] === b_current;
				stack_a.push(a_current);
				stack_b.push(b_current);
				if(!Equal(a_current, stack_a)(b_current, stack_b))
					return false;
			}
		}
		return true;
	};
	js.Equal = a => b => Equal(a, [])(b, []);
	
	js.Fold = folder => result => target => Object.keys(target).reduce((result, key) => folder(result)(target[key]), result);
	js.FoldRight = folder => result => target => Object.keys(target).reduceRight((result, key) => folder(result)(target[key]), result);
	
	const ToRawObject = target => js.IsPrimitive(target) ? {} : new target.constructor;
	js.Map = fn => target => js.Fold(result => key => (result[key] = fn(target[key]), result))(ToRawObject(target))(Object.keys(target));
	js.Filter = fn => target => js.Fold(result => key => ((value => fn(value) && (result[key] = value))(target[key]), result))(ToRawObject(target))(Object.keys(target));
	
	const Flatten = (target, options, stack) => {
		if(typeof options === 'string') {
			let temp = {};
			temp[options] = true;
			options = temp;
		} else options = options || {};
		let result = [];
		let iteratee = [
			// normal
			function(key) {
				let value = target[key];
				if(js.IsPrimitive(value))
					result.push(value);
				else
					result = result.concat(value);
			},
			// strict
			function(key) {
				let value = target[key];
				if(value instanceof Array)
					result = result.concat(target[key]);
			},
			// recurse
			function(key) {
				let value = target[key];
				if(js.IsPrimitive(value))
					result.push(value);
				else {
					if(!(stack instanceof Array))
						stack = [];
					stack.push(value);
					let flattened = Flatten(value.filter(function(current) {
						return !stack.some(function(stack_value) {
							return stack_value === current;
						})
					}), { recursive: true }, stack);
					result = result.concat(flattened);
				}
			}
		][(js.ToInt(options.recursive) && 2) || js.ToInt(options.strict)];
		Object.keys(target).forEach(iteratee);
		return result;
	};
	js.Flatten = (target, options) => Flatten(target, options, []);
	
	const Trim = (str, options) => {
		if(js.IsPrimitive(options))
			options = {};
		js.HardMixin({
			tabsize: 4,
			continuous_line_break: Infinity
		})(options);
		let EOL = str.indexOf('\r\n') + 1 ? '\r\n' : str.indexOf('\r') + 1 ? '\r' : '\n';
		let lines = str.split(EOL);
		
		let min_indent_width = lines.reduce(function(a, b) {
			return Math.min(a, Trim.GetIndentWidth(b)(options.tabsize));
		}, Infinity);
		if(min_indent_width !== 0)
			lines = lines.map(function(line) {
				let indent_length = 0, prev = '', current;
				while(
					indent_length < min_indent_width
					&& Trim.IsIndent(current = prev + line[indent_length])
					&& Trim.GetIndentWidth(current)(options.tabsize) <= min_indent_width
					) {
					++indent_length;
					prev = current;
				}
				return line.slice(prev.length);
			});
		if(options.continuous_line_break < Infinity) {
			let break_free = [];
			for(let i = 0, line; i < lines.length; ++i) {
				line = lines[i];
				let break_count = 0;
				while(break_count + i < lines.length && Trim.IsIndent(lines[i + break_count]))
					++break_count;
				if(!break_count) {
					break_free.push(line);
					continue;
				}
				break_free = break_free.concat(lines.slice(i, Math.min(break_count, options.continuous_line_break) + 1));
				i += break_count - 1;
			}
			lines = break_free;
		}
		return lines.map(line => line.match(/(^.*?)\s*$/)[1]).join(EOL);
	};
	Trim.IsIndent = str => !!str.match(/^\s*$/);
	Trim.GetIndentWidth = line => tabsize => {
		let indent = line.match(/^\s*/);
		if(indent === null)
			return 0;
		indent = js.ToArray(indent[0]);
		let tab_count = indent.filter(function(c) {
			return c === '\t';
		}).length;
		return tab_count * (tabsize - 1) + indent.length;
	};
	js.Trim = (str, options) => Trim(str, options);
	
	js.Load = (...args) => {
		let options = typeof args[args.length - 1] === 'object' ? args.pop() : {};
		js.SoftMixin({
			success: null,
			fail: null,
			finally: null
		})(options);
		let urls = js.Trim(args.join('\n').replace(/\r/g, '\n'), { continuous_line_break: 0 }).split('\n').map(js.Trim);
		let length = urls.length;
		if(!length) {
			options.success && options.success([]);
			return;
		}
		
		let instances = [];
		
		!function LoadNext(i) {
			let url = urls[i];
			let filetype = url.slice(url.indexOf('.') + 1), instance;
			let type_loader = js.Load.type_loader[filetype];
			if(!type_loader)
				throw new TypeError('Unresolvable file type: ' + filetype);
			instance = type_loader.create();
			instances.push(instance);
			instance.addEventListener('fail', () => {
				options.fail && options.fail(instance);
				options.finally && options.finally(instances);
			});
			let load = i + 1 === length ? () => {
				options.success && options.success(instances);
				options.finally && options.finally(instances);
			} : () => LoadNext(i + 1);
			type_loader.action(instance);
			instance.addEventListener('load', load);
			instance[type_loader.url_attribute] = url;
		}(0);
	};
	js.Load.type_loader = {
		js: {
			create: function() {
				return document.createElement('script');
			},
			action: function(instance) {
				document.documentElement.lastElementChild.appendChild(instance);
			},
			url_attribute: 'src'
		},
		css: {
			create: function() {
				let link = document.createElement('link');
				link.setAttribute('rel', 'stylesheet');
				return link;
			},
			action: function(instance) {
				document.getElementsByTagName('head')[0].appendChild(instance);
			},
			url_attribute: 'href'
		}
	};
}();