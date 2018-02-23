/**
 * Represents a very simple on/off handler
 * borrowed from @veams/query
 *
 * @module EventElement
 */
let componentEvents = [];

export class EventElement {

	/**
	 * VeamsQuery DOM wrapper object
	 *
	 * @param {Object} selector - selector (element)
	 */
	constructor(selector) {
		this[0] = selector;
	}

	/**
	 * Attach an event handler function for one or more events to the selected elements
	 *
	 * @param {String} eventNames - name(s) of event(s) to be registered for matched set of elements
	 * @param {String} [selector] - selector string to filter descendants of selected elements triggering the event
	 * @param {Function} handler - event handler function
	 * @param {Boolean} [useCapture] - dispatch event to registered listeners before dispatching it to event target
	 * @return {Object} - VeamsQuery object
	 */
	on(eventNames, selector, handler, useCapture) {
		let i = 0;
		let events = typeof eventNames === 'string' && eventNames.split(' ');
		let targetSelector = typeof selector === 'string' ? selector : undefined;
		let evtHandler = typeof selector === 'function' ? selector : typeof handler === 'function' ? handler : undefined;
		let capture = typeof handler === 'boolean' ? handler : typeof useCapture === 'boolean' ? useCapture : false;
		let delegateTarget;

		if (!events) {
			console.error('@veams/component :: on() - Event name not specified');

			return this;
		}

		if (!evtHandler) {
			console.error('@veams/component :: on() - Event handler not specified');

			return this;
		}

		for (let j = 0; j < events.length; j++) {
			let [event, namespace] = events[j].split('.');

			let handler = (e) => {
				if (targetSelector) {
					delegateTarget = e.target.closest(targetSelector);

					if (delegateTarget) {
						evtHandler(e, delegateTarget);
					}
				}
				else {
					evtHandler(e, e.currentTarget);
				}
			};

			this[0].addEventListener(event, handler, capture);

			componentEvents.push({
				node: this[0],
				event: event,
				namespace: namespace,
				handler: handler,
				originHandler: evtHandler,
				selector: targetSelector
			});
		}

		return this;
	}

	/**
	 * Detach an event handler for one or more events from the selected elements
	 *
	 * @param {String} eventNames - name(s) of event(s) to be unregistered for matched set of elements
	 * @param {String} [selector] - selector string to filter descendants of selected elements triggering the event
	 * @param {Function} [handler] - event handler
	 * @return {Object} - VeamsQuery object
	 */
	off(eventNames, selector, handler) {
		let i = 0;
		let events = eventNames.split(' ');

		let targetSelector = typeof selector === 'string' ? selector : undefined;
		let evtHandler = typeof selector === 'function' ? selector : typeof handler === 'function' ? handler : undefined;

		for (let j = 0; j < events.length; j++) {
			let [event, namespace] = events[j].split('.');
			let k = componentEvents.length - 1;

			for (k; k >= 0; --k) {
				let unbindEvt = false;

				if (componentEvents[k].node === this[0] && componentEvents[k].event === event &&
					componentEvents[k].namespace === namespace && componentEvents[k].selector === targetSelector) {

					if (evtHandler) {
						if (componentEvents[k].originHandler === evtHandler || componentEvents[k].handler === evtHandler) {
							unbindEvt = true;
						}

					}
					else {
						unbindEvt = true;
					}

					if (unbindEvt) {
						this[0].removeEventListener(event, componentEvents[k].handler);
						componentEvents.splice(k, 1);
					}
				}
			}
		}

		return this;
	}
}

export default function (selector) {
	return new EventElement(selector);
};