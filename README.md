# Component (@veams/component)

**Component Class for Components which can be used in Veams projects.**

---------

## Features

- Auto binding (subscribe/unsubscribe) of events
- 
- 


---------

## Installation

### NPM 

``` bash
npm install @veams/component --save
```

### Yarn 

``` bash
yarn add @veams/component
```

---------

### Usage

``` js
class Test extends Component {
	constructor(obj) {
		let options = {
			selectors: {
				'container': '.test',
				'btn': '.btn-danger'
			},
			classes: {
				active: 'is-active'
			}
		};

		super(obj, options);
	}
}

const test = new Test({
	// el: $(''),
	namespace: 'test',
	options: {
		selectors: {
			'container': '.container'
		}
	}
});
```

#### Output 

``` json
{
	"_namespace": "test",
	"_instanceId": "test_1518477164034_266f9fa5-6faf-064b-7d2e-e23cfaf2855e",
	"options": {
		"selectors": {
			"test": ".container",
			"btn": ".btn-danger"
		},
		"classes": {
			"active": "is-active"
		}
	},
	"_el": {}
}
```