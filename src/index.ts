'use strict';

/**
 * Represents a component constructor which supports
 * options merging,
 * binding and unbinding of events and subscriptions with template strings,
 * rendering of templates
 * and a destroy behaviour.
 *
 * @module @veams/component
 * @author Sebastian Fitzner
 */

/**
 * Imports
 */
import Base, { BaseConfig } from '@veams/base';
import { Collection } from './helpers/collection';
import getStringValue from './helpers/get-string-value';
import tplEngine from './helpers/template-engine';
import eventHandler from './helpers/event-handler';

export interface ComponentConfig extends BaseConfig {
	context?: any; // @TODO: Check type
}

export interface Subscriber {
	id?: string;
	delegate?: any;
	type: any;
	event: any;
	handler: any;
}

/**
 * Custom Functions
 */
function buildEvtId(evtKeyArr, fnName) {
	return evtKeyArr.join('_') + '_' + fnName;
}

/**
 * Hidden variables
 */

// Custom event handler element which will be used in `events()` and `subscribe`
let eventElement = null;

abstract class Component extends Base {
	context: any;
	_events: {
		[key: string]: string
	};
	_subscribe: {
		[key: string]: string
	};
	__subscribers: Collection<Subscriber>;
	private __eventElement: any; // TODO :: Create definition

	/**
	 * Constructor
	 *
	 * to save standard elements like el and options and
	 * execute initialize as default method.
	 *
	 * @param {Object} obj [{}] - Object which contains el, options from the DOM and namespace.
	 * @param {Object} options [{}] - Object which contains options of the extended class.
	 */
	constructor(obj: ComponentConfig, options = {}) {
		super(obj, options);

		this.context = obj.context || window['Veams'];
		this.__eventElement = eventHandler(this.el);

		if (!this.context) {
			console.info('@veams/component :: There is no context defined! When you want to use @veams/plugin-vent or any other singleton shared by your Veams instance provide the Veams object as context!');
		}


		this.initialize(obj, options);
	}

	// ----------------------------------------------------------
	// GETTER & SETTERS
	// ----------------------------------------------------------

	/**
	 * Get and set events object
	 */
	set events(obj) {
		this._events = obj;
	}

	get events() {
		return this._events;
	}

	/**
	 * Get and set subscribe object
	 */
	set subscribe(obj) {
		this._subscribe = obj;
	}

	get subscribe() {
		return this._subscribe;
	}

	addSubscriber(obj: Subscriber) {
		if (!this.__subscribers) {
			this.__subscribers = {};
		}

		this.__subscribers[obj.id] = {
			delegate: obj.delegate,
			type: obj.type,
			event: obj.event,
			handler: obj.handler
		};
	}

	get _subscribers(): Collection<Subscriber> {
		return this.__subscribers;
	}

	// ----------------------------------------------------------
	// STANDARD METHODS
	// ----------------------------------------------------------
	initialize(...args) {}

	/**
	 * Private method to create all necessary elements and bindings.
	 *
	 * @private
	 */
	create() {
		this.preRender();
		this.registerEvents(this.events, false);
		this.registerEvents(this.subscribe, true);
		this.bindEvents();
	}

	/**
	 * Bind local and global events
	 *
	 * @public
	 */
	bindEvents() {
	}

	/**
	 * Unbind events
	 *
	 * @public
	 */
	unbindEvents() {
	}

	/**
	 * Pre-Render templates
	 * which can be used to render content into it
	 *
	 * @public
	 */
	preRender() {
		return this;
	}

	/**
	 * Render your module
	 *
	 * @public
	 */
	render() {
		return this;
	}

	/**
	 * Destroy component by unbinding events and
	 * removing element from DOM
	 */
	destroy() {
		this.unregisterEvents();
		this.unbindEvents();
		this.el.remove();
	}

	/**
	 * Render template with data
	 *
	 * @param {String} tplName - Template name which gets returned as rendered element.
	 * @param {Object} data - Data which gets handled by the template.
	 */
	renderTemplate(tplName: string, data: object) {
		if (!this.context.templater) {
			console.error(`
				@veams/component :: It seems that you haven\'t added the @veams/plugin-templater. In order to work with 'renderTemplate()' you need to add it!
			`);
		} else {
			return this.context.templater.render(tplName, data);
		}
	}

	// ----------------------------------------------------------
	// MOUNT PROCESS METHODS
	// Mount process methods will be handled by the VeamsModules plugin
	// ----------------------------------------------------------

	/**
	 * This method will be executed after initialise
	 */
	abstract willMount();

	/**
	 * This method will be executed before unregistering events
	 */
	abstract willUnmount();

	/**
	 * This method will be executed after render
	 */
	abstract didMount();

	/**
	 * This method will be executed after unregistering events
	 */
	abstract didUnmount();

	// ----------------------------------------------------------
	// EVENTS METHODS
	// ----------------------------------------------------------

	/**
	 * Register multiple events which are saved in an object.
	 *
	 * @param {Object} evts - Events object which contains an object with events as key and functions as value.
	 * @param {Boolean} global - Flag to switch between global and local events.
	 *
	 * @private
	 */
	registerEvents(evts: object, global = false) {
		if (evts) {
			Object.keys(evts).forEach((key) => {
				this.registerEvent(key, evts[key], global);
			});
		}
	}

	/**
	 * Register an event by using a simple template engine and
	 * a key/value pair.
	 *
	 * @param {String} evtKey - Event key which contains event and additionally a delegated element.
	 * @param {String} fn - Function defined as string which will be bound to this.
	 * @param {Boolean} global - Flag if global or local event .
	 *
	 * @public
	 *
	 * @example
	 * this.registerEvent('click .btn', 'render');
	 * this.registerEvent('click {{this.options.btn}}', 'render');
	 * this.registerEvent('{{App.EVENTS.custom.event', 'render');
	 * this.registerEvent('{{App.EVENTS.resize', 'render', true);
	 */
	registerEvent(evtKey: string, fn: string, global = false) {
		if (typeof evtKey !== 'string') {
			console.error('@veams/component :: Your event is not a string!');
			return;
		}

		if (typeof fn !== 'string') {
			console.error('@veams/component :: Your event handler function is not a string!');
			return;
		}

		let evtKeyArr = evtKey.split(' ');
		let arrlen = evtKeyArr.length;
		let evtType = getStringValue.apply(this, [tplEngine(evtKeyArr[0]), this.context]);
		let bindFn = this[fn].bind(this);
		let id = buildEvtId(evtKeyArr, fn);

		if (arrlen > 2) {
			throw new Error('@veams/component :: It seems like you have more than two strings in your events object!');
		}

		// Bind on this.el
		if (arrlen === 1 && !global) {
			this.__eventElement.on(evtType, bindFn);

			this.addSubscriber({
				type: 'event',
				id: id,
				event: evtType,
				handler: bindFn
			});

		} else if (arrlen === 1 && global) {
			if (!this.context && !this.context.Vent) {
				console.warn('@veams/component :: There is no context or the Vent object is missing. Subscribing to global events will not work without it!');
				return;
			}

			this.context.Vent.subscribe(evtType, bindFn);

			this.addSubscriber({
				type: 'globalEvent',
				id: id,
				event: evtType,
				handler: bindFn
			});
		} else {
			let delegate = getStringValue.apply(this, [tplEngine(evtKeyArr[1])]);

			this.__eventElement.on(evtType, delegate, bindFn);

			this.addSubscriber({
				type: 'delegatedEvent',
				delegate: delegate,
				id: id,
				event: evtType,
				handler: bindFn
			});
		}
	}

	/**
	 * Delete all registered events.
	 */
	unregisterEvents() {
		for (let key in this._subscribers) {
			if (this._subscribers.hasOwnProperty(key)) {
				let obj = this._subscribers[key];

				if (obj.type === 'globalEvent') {
					if (!this.context && !this.context.Vent) {
						console.warn('@veams/component :: There is no context or the Vent object is missing. Subscribing to global events will not work without it!');
						return;
					}
					this.context.Vent.unsubscribe(obj.event, obj.handler);
				} else if (obj.type === 'delegatedEvent') {
					this.__eventElement.off(obj.event, obj.delegate, obj.handler);
				} else {
					this.__eventElement.off(obj.event, obj.handler);
				}
			}
		}
	}

	/**
	 * Unregister an event by using the saved subscribers and
	 * a key/value pair.
	 *
	 * @param {String} evtKey - Event key which contains event and additionally a delegated element.
	 * @param {String} fn - Function defined as string which will be unbound to this.
	 *
	 * @public
	 *
	 * @example
	 * this.unregisterEvent('click .btn', 'render');
	 * this.unregisterEvent('click {{this.options.btn}}', 'render');
	 * this.unregisterEvent('{{App.EVENTS.custom.event', 'render');
	 * this.unregisterEvent('{{App.EVENTS.resize', 'render');
	 */
	unregisterEvent(evtKey: string, fn: string) {
		let evtKeyArr = evtKey.split(' ');
		let id = buildEvtId(evtKeyArr, fn);

		if (this._subscribers[id]) {
			let obj = this._subscribers[id];

			if (obj.type === 'globalEvent') {
				if (!this.context && !this.context.Vent) {
					console.warn('@veams/component :: There is no context or the Vent object is missing. Subscribing to global events will not work without it!');
					return;
				}
				this.context.Vent.unsubscribe(obj.event, obj.handler);
			} else if (obj.type === 'delegatedEvent') {
				this.__eventElement.off(obj.event, obj.delegate, obj.handler);
			} else {
				this.__eventElement.off(obj.event, obj.handler);
			}
		}
	}
}

export default Component;