# Component (@veams/component)

**Component Class for Components which can be used in Veams projects.**


## Features

The class provides a base system to build components. It merges options, bind and unbind events without worrying about that, subscribe to global events and renders templates with data.


## Installation

### NPM 

``` bash
npm install @veams/component --save
```

### Yarn 

``` bash
yarn add @veams/component
```


## Usage

### Initial methods

#### `constructor(obj)`
- default options are defined here
- you have to call `super(obj, options)` to merge default with markup options

#### `initialize()`
- called on init
- useful for preparing your component

#### `preRender()`
- if needed templates can be prerendered here using `renderTemplate` (see section "Render templates")

#### `bindEvents()`
- bind events manually here using `registerEvent` (see section "Events / Manual binding")

#### `render()`
- called as long as option `render` is not set to `false` in options of module loader
- render your templates here or update the state of your component

### Lifecycle hooks

The VeamsComponent provides useful lifecycle hooks.

#### `willMount()`
- executed after initialize

#### `didMount()`
- executed after initial render

#### `willUnmount()`
- executed **before** unregistering events

#### `didUnmount()`
- executed **after** unregistering events

---------------

### Merging options
- default options defined in constructor will be merged with markup options by calling `super(obj, options)` in constructor
- markup options have higher priority and always overwrite default options properties of the same name

Example for overwriting default options with markup options:

``` html
<div
    data-js-module="slider"
    data-js-options='{
        "infinite": true,
        "pauseOnHover": false}'
>...</div>
```

---------------

### Event Handling

#### `subscribe`
The `VeamsComponent` can subscribe to global events using the getter `subscribe`.
Global events can be triggered with `Veams.Vent.trigger('eventName')`.

Example for global event subscription:

``` js
get subscribe() {
	return {
		'{{Veams.EVENTS.resize}}': 'onResize'
	};
}
```

#### `events`

Local events can be bound by using the getter `events`.

##### Example 1 (without event delegation)

``` js
get events() {
	return {
		'click': 'onClick'
	};
}
```

In this case the event listener is bound to `this.el` and executed as soon as the element itself or any of its children is clicked.

##### Example 2 (with event delegation)

``` js
get events() {
	return {
		'click {{this.options.specialBtn}}': 'onClick'
	};
}
```

In this case the event listener is also bound to `this.el` but only executed when the element is clicked which is predefined as `specialBtn` in options.

#### Manual event binding with `registerEvent()`

Sometimes you need to bind events conditionally. Using the provided `registerEvent` method is a comfortable way.

Example of manually registering local event in automatically called `bindEvents`

``` js
bindEvents() {
	...

	if (condition) {
	
		// register global event
		this.registerEvent('{{this.options.globalEvent}}', 'eventHandler', true);
	
		// register local event with event delegation
		this.registerEvent('{{Veams.EVENTS.keydown}} {{this.options.someSubComponent}}', 'onKeydown');
	}
	
	...
}
```

------------------

### Render templates with `renderTemplate()`

Rendering templates with Veams is pretty easy. You only have to specify the names of templates you want to use in the options of your component and then make a call to the `renderTemplate` function, passing the template name and the data as parameters.

``` js
render() {

	// render template with provided data
	let tmpl = this.renderTemplate('btn', this.data);

	// append output to current element
	this.$el.append(tmpl);
}
```

------------------

### Example


``` js
import $ from 'jquery';
import Component from '@veams/component';

class Comparer extends Component {
	/**
	 * Constructor for our class
	 *
	 * @see module.js
	 *
	 * @param {Object} obj - Object which is passed to our class
	 * @param {Object} obj.el - element which will be saved in this.el
	 * @param {Object} obj.options - options which will be passed in as JSON object
	 */
	constructor(obj) {
		let options = {
			handle: '[data-js-item="comparer-handle"]',
			topContainer: '[data-js-item="comparer-top-container"]',
			topContent: '[data-js-item="comparer-top-content"]',
			draggClass: 'is-dragging',
			dragMode: true,
			topContentRight: false,
			disabled: {
				'desktop': false,
				'tablet-large': false,
				'tablet-small': false,
				'mobile-large': false,
				'mobile-medium': false,
				'mobile-small': false
			}
		};

		super(obj, options);
	}

	/** =================================================
	 * EVENTS
	 * ================================================ */

	/**
	 * Subscribe to global events of Veams or App namespace.
	 */
	get subscribe() {
		return {
			'{{Veams.EVENTS.resize}}': 'preRender',
			'{{Veams.EVENTS.mediachange}}': 'render'
		};
	}

	/**
	 * Bind local events to this.$el.
	 */
	get events() {
		return {
			'mousedown {{this.options.handle}}': 'mouseDown',
			'mouseup': 'mouseUp',
			'touchstart {{this.options.handle}}': 'mouseDown',
			'touchend': 'mouseUp',
			'mousemove': 'resizeContainer'
		};
	}

	/** =================================================
	 * STANDARD METHODS
	 * ================================================= */

	/**
	 * Initialize the view and merge options
	 *
	 */
	initialize() {
		...
	}


	/**
	 * Pre-Render method
	 */
	preRender(){
		...
	}

	/**
	 * Render method
	 */
	render() {
		...
	}

	/** =================================================
	 * CUSTOM METHODS
	 * ================================================= */

	mouseDown(e) {
		...
	}

	mouseUp() {
	    ...
	}
	
	resizeContainer(e) {
		...
	}
}

export default Comparer;
```