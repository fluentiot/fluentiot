# Fluent IoT

Fluent IoT provides a fluent and intuitive DSL (domain-specific language) programming framework interface for creating human-readable scenarios for IoT control. It is designed for developers who want to create customized IoT solutions.



**Important Note:** Fluent IoT is not a graphical user interface (GUI) platform like Home Assistant or similar solutions. It is a framework meant to be integrated into your code. You must already have the ability to both see the state of your IoT devices and interact with them for Fluent to be of any use.


## Features

**Scenario Management**
Easily create and manage IoT scenarios with a human-readable fluent syntax.

**Event-Driven**
The framework is built around one central event bus for all device, variable, time and attribute updates.

**Device Abstraction**
Define and manage IoT devices with capabilities.

**Room Management**
Basic room management to know if a room is occupied or vacant based on sensors.

**Variable Handling**
Manage custom variables within your IoT scenarios for state.

**Extensibility**
Extend and replace the framework with your own devices, scenarios, and components.

**Simple**
Easy to read framework with no async


## Connecting IoT Devices

Fluent IoT is designed to work with your own IoT devices. Users are required to connect their devices to the code using the provided `device` component interface.


## Installation

```bash
npm install weather-js
```


## Scenario Usage

A scenario is made up of these elements:

### Declaration

```javascript
scenario('Office lights on when PIR is triggered or is 6pm')
```
This sets up a scenario.

### Trigger

```javascript
.when()
    .time.is('18:00')
    .room('office').isOccupied()
```
Specifying the triggers that will run the following actions. In this case either the time is 6:00pm or the room is now occupied because a PIR sensor updated the occupancy.

### Constraints and Actions

```javascript
.constraint()
    .time.between('00:00', '06:00')
    .then(() => {
        device.get('office lights').warmLights()
    })
.constraint()
    .time.between('06:01', '17:59')
    .then(() => {
        device.get('office lights').dayLights()
.else()
    .then(() => {
        device.get('office lights').eveningLights()
    })
```
Multiple constraint groups using the `time` component to decide which `capability` to use for the office lights.

For this to example to work you would need to setup both your `device` and the device `capability`.


### Simple Example

```javascript
scenario('At 6:00pm turn on the office light')
    .when()
        .time().is('18:00')
    .then(() => {
        device.get('office lights').turnOn()
    });
```

In this example at 6:00pm the office lights are turned on. There are no constraints.




# API

## Contents

- [Scenario API](#scenario-api)
- [Day API](#day-api)
- [Time API](#time-api)
- [Device API](#device-api)
- [Capability API](#capability-api)
- [Event API](#event-api)
- [Expect API](#expect-api)
- [Room API](#room-api)
- [Scene API](#scene-api)
- [Variable API](#variable-api)

---

## Scenario API

#### `when()`
Trigger or triggers for the scenario. If multiple triggers are used they act as an "or".
```javascript
scenario('18:00, sensor is true or room is occupied')
    .when()
        .time.is('18:00')
        .device('pir').attribute('sensor').isTruthy()
        .room('office').isOccupied()
    .then(()=>{});

scenario('using empty can be useful for debugging a scenario')
    .when().empty()
    .then(()=>{ console.log('It ran!') })
    .assert();
```

#### `test()`
For debugging if `.test()` is added to any scenario only these scenarios can be triggered and all other scenarios are disabled from running.
```javascript
scenario('will not run at 17:00 and not in test mode')
    .when().time.is('17:00')
    .then(()=>{});

scenario('will run at 18:00 because in test mode')
    .when().time.is('18:00')
    .then(()=>{})
    .test();

scenario('will run at 19:00 because also in test mode')
    .when().time.is('19:00')
    .then(()=>{})
    .test();
```


#### `assert()`
For debugging if `.assert()` is added to any scenario the scenario will be triggered.
```javascript
scenario('forced to run because assert() was used')
    .when()
        .time.is('19:00')
    .then(()=>{ console.log('Triggered'); })
    .assert();
```



#### `.constraint()`
Constraints are optional. Each component has it's own set of constraints and in the examples below they are using the `datetime` component. Multiple constraints can be used, creating constraint groups. Each constraint must have a `then()`.
```javascript
scenario('constraint triggers at 19:00 and checks if weekend')
    when()
        .time.is('19:00')
    .constraint()
        .day.is('weekend')
        .then(()=>{ console.log('It is the weekend'); });

scenario('constraint triggers at 19:00 and checks the days')
    when()
        .time.is('19:00')
    .constraint()
        .day.is(['Mon','Tue'])
        .then(()=>{ console.log('Is it Monday or Tuesday'); })
    .constraint()
        .day.is('Wed', 'Thur','Friday')
        .then(()=>{ console.log('It is Wednesday, Thursday, or Friday'); })
    .else()
        .then(()=>{ console.log('Is it the weekend'); })

scenario('no constraints')
    when()
        .time.is('19:00')
    .then(()=>{ console.log('Triggered'); });
```

#### `.then(Scenario, ...args)`
`then()` is used for the actions that will be carried out.

```javascript
scenario('it will output this scenario name')
    when().empty()
    .then((Scenario) => {
        console.log(`Scenario "${Scenario.name}" triggered`);
    })
    .assert();

scenario('assert and triggers can return args to then()')
    when().empty()
    .then((_Scenario, colour1, colour2) => {
        console.log(`Colour 1: "${colour1}"`)  //red
        console.log(`Colour 2: "${colour2}"`)  //green
    })
    .assert('red', 'green');
```


---



## Day API

### Triggers

Day currently has no triggers.

```javascript
scenario('Only on Saturday at 7am')
    .when()
        .time.is('07:00')
    .constraint()
        .day.is('Saturday')
        .then((Scenario) => { console.log(Scenario.name); })
    .assert();
```

### Constraints

#### `.day.is(string | array)`

Supports a single argument or multiple arguments for multiple days.

Supported arguments: `weekend, weekday, monday, mon, tuesday, tue, wednesday, wed, thursday, thur, friday, fri, saturday, sat, sunday, sun`.

```javascript
scenario('Only on a Saturday')
    .when().empty()
    .constraint()
        .day.is('Saturday')
        .then((Scenario) => { console.log(Scenario.name); })
    .assert();

scenario('Saturday or Monday')
    .when().empty()
    .constraint()
        .day.is(['Saturday', 'mon'])
        .then((Scenario) => { console.log(Scenario.name); })
    .assert();

scenario('Only on a Weekend')
    .when().empty()
    .constraint()
        .day.is('weekend')
        .then((Scenario) => { console.log(Scenario.name); })
    .assert();
```


---


## Time API

### Triggers

#### `.time.is(time: string)`
If the time is matching, must be in `HH:mm` format.
```javascript
scenario('Time is 7am')
    .when()
        .time.is('07:00')
    .then((Scenario) => { console.log(Scenario.name); });
```


#### `.time.every(expression: string)`
Repeating the trigger at set intervals.
Supports seconds (`sec, second, seconds`), minutes (`min, minute, minutes`) and hours (`hr, hour, hours`).
```javascript
scenario('Triggers every second')
    .when()
        .time.every('1 second')
    .then((Scenario) => { console.log(Scenario.name); });

scenario('Triggers 2 minutes')
    .when()
        .time.every('2 min')
    .then((Scenario) => { console.log(Scenario.name); });

scenario('Triggers 12 hours')
    .when()
        .time.every('12 hr')
    .then((Scenario) => { console.log(Scenario.name); });
```


### Constraints

#### `.time.between(start_time: string, end_time: string)`
Checking if the scenario was triggered between two times.
```javascript
scenario('Between times')
    .when().empty()
    .constraint()
        .time.between('00:00', '12:00')
        .then(() => { console.log('Good Morning'); })
    .constraint()
        .time.between('12:01', '18:00')
        .then(() => { console.log('Good Afternoon'); })
    .constraint()
        .time.between('18:01', '23:59')
        .then(() => { console.log('Good Evening'); })
    .assert();
```


---



## Device API

### Management

The `device` and typically `capability` components must be included for management.
```javascript
const { device, capability } = require('fluent-iot');
```


#### `device.add(name: string, attributes: object, capabilities: array)`
Create a new IoT device.
```javascript
//Creating a basic device
device.add('kitchen-light');

//Adding a device with default attributes
device.add('kitchen-light', { id:'Xyz' });

//Adding a device with capabilities using the @ reference
capability.add('on', () => {});
capability.add('off', () => {});
device.add('kitchen-light', {}, [ '@on', '@off' ])

//Adding a device passing capability object
const warm = capability.add('warm', () => {});
device.add('office-light', {}, [ '@on', '@off', warm ])
```

#### `device.get(name: string)`
Fetching a device.
```javascript
//Basic add and get
device.add('kitchen-light');
const kitchenLight = device.get('kitchen-light');

//Fetching a device attribute
device.add('office-switch', { id:'Abc' });
console.log(device.get('office-switch').attribute.get('id'));
```


#### `device.findByAttribute(attributeName: string, attributeValue: any)`


### Triggers


### Constraints





---





## Capability API

Capabilities are exclusive to devices within the Fluent IoT framework.

Consider an LED light that possesses various capabilities, such as turning on, turning off, or changing colors like red, green, and blue. Similarly, a switch may have the capability to be toggled on or off. However, it's crucial to note that a PIR sensor, being an informational device, does not typically have a sensor capability. In the context of Fluent IoT, capabilities are methods used to interact with IoT devices rather than accessing the information they provide.

Capabilities can be shared across multiple devices making it a reusable component. It is also serves as a bridge from the framework to your IoT service device manager.

### Management

The `capability` component must be included for management.
```javascript
const { capability } = require('fluent-iot');
```

#### `capability.add(name: string, object: callback)`
Creation of a new reusable capability.
```javascript
capability.add('lightOff', () => {
    console.log('Light off!');
});
device.add('office-light', {}, [ '@lightOff' ]);
device.get('office-light').lightOff();
```

More advanced usage showing reusability.

```javascript
const lightOff = capability.add('lightOff', (device) => {
    //Do an API call etc.. to your IoT device referencing the ID
    const deviceId = device.attribute.get('id');
    console.log(`Turning device "${deviceId}" off`);
});

//Create office light and add the capability
device.add('office-main-light', { id:1 });
device.get('office-main-light').capability.add('@lightOff');

//Create office desk light with the capability in setup
device.add('office-desk-light', { id:2 }, [ '@lightOff' ]);

//Create office monitor light passing the capability directly
device.add('office-monitor-light', { id: 3 }, [ lightOff ])

//Turn the lights off
device.get('office-main-light').lightOff();
device.get('office-desk-light').lightOff();
device.get('office-monitor-light').lightOff();
```




---





## Event API

The `event` component is the central bus for all triggers. It uses the native [NodeJS event emitter](https://nodejs.org/api/events.html) and aliases `emit` and `on`.

### Management

The `event` component must be included for management.
```javascript
const { event } = require('fluent-iot');
```

#### `.event.emit(eventName: string[, ...args]);`
See official [emit documentation](https://nodejs.org/api/events.html#emitteremiteventname-args).
```javascript
scenario('Lock down')
    .when()
        .event.on('lockdown', true)
    .then(() => {
        console.log('Locking down')
    });
event.emit('lockdown', true);
```

#### `.event.on(eventName: string);`
See official [emit documentation](https://nodejs.org/api/events.html#emitteroneventname-listener).
```javascript
event.on('lockdown', () => {
    console.log('Locking down!');
});
event.emit('lockdown', true);
```


### Triggers

#### `.event(name: string).is(value: any)`
When an event is emitted with a specific value.
```javascript
scenario('Lock down when event is detected')
    .when()
        .event('lockdown').is(true)
    .then(() => {
        console.log('Lock down!');
    });
event.emit('lockdown', true);
```

#### `.event(name: string).on()`
When an event is emitted.
```javascript
scenario('Pretty colours')
    .when()
        .event('lockdown').on()
    .then((_Scenario, colour) => {
        console.log(`Pretty colour: ${colour}`);
    });
event.emit('colour', 'red');
event.emit('colour', 'green');
event.emit('colour', 'blue');
```


---


## Room API

Rooms serve as a component for managing room occupancy, especially when relying on a PIR sensor's state may not be entirely reliable. In scenarios where a person is present in a room but not actively moving, the sensor may send a "false" signal. The room component introduces a time threshold that helps mitigate the impact of such "false" signals, allowing for a more accurate determination of room vacancy.

It is important to read the `updatePresence` API to understand how to fully manage occupancy.

### Management

The `room` component must be included for management.
```javascript
const { room } = require('fluent-iot');
```

#### `room.add(name: string, attributes: object)`
Creates a new room that can be used for monitoring occupancy.
See `updatePresence()` API to update the occupancy.
```javascript
//Office room with no default attributes
room.add('office');
console.log(room.get('office').isOccupied()); //False

//Living room with default attribute of occupied
room.add('living', { occupied:true });
console.log(room.get('living').isOccupied()); //True

//Updating the default duration to be occupied after receiving a 'false' occupancy sensor value
const playroom = room.add('playroom', { thresholdDuration:5 });
```

#### `room.get(name: string)`
Get a room by its name. If the room does not exist it will return `null`.
```javascript
//Using the .get() API
room.add('office');
console.log(room.get('office').name); //"office"

//Direct
const office = room.add('office');
console.log(office.name); //"office"
```


#### `room.get(name: string).isOccupied()`
Returns `true` if occupied or `false` if vacant.
```javascript
const office = room.add('office');

office.attribute.set('occupied', true);
console.log(office.isOccupied());    //true

office.attribute.set('occupied', false);
console.log(office.isOccupied());    //false
```


#### `room.get(name: string).updatePresence(sensorValue: boolean)`
The presence should be called on a room sensor's value (e.g. PIR sensor). This will use the `thresholdDuration` option used in the `room.add()` API.
```javascript
// The default thresholdDuration is 15 minutes
room.add('living');

// After 5 minutes of the room not having a positive sensor value the room will become vacant
room.add('office', { thresholdDuration: 5 });

// To ignore the threshold set it to 0
room.add('pantry', { thresholdDuration: 0 });
```

Using this API with a scenario and simulating device updates.
```javascript
room.add('office', { thresholdDuration: 5 });
device.add('office-pir');

//Listening to PIR updates
scenario('Office PIR sensor with movement and update presence')
    .when()
        .device('office-pir').attribute('sensor').is(true)
    .then(() => {
        room.get('office').updatePresence(true);
        console.log(room.get('office').isOccupied()); //true
        //.room('office').is.occupied() trigger will be called
    });

scenario('Office PIR sensor with no movement')
    .when()
        .device('office-pir').attribute('sensor').is(false)
    .then(() => {
        room.get('office').updatePresence(false);
        console.log(room.get('office').isOccupied()); //true
        //...in 5 minutes:
        //.isOccupied() will be false
        //.room('office').is.vacant() trigger will be called
    });

//Listening to occupancy updated
scenario('Office lights on when occupied')
    .when()
        .room('office').is.occupied()
    .then(() => {
        console.log('Room is occupied, turn on lights etc...');
    });

scenario('Office lights off when vacant')
    .when()
        .room('office').is.vacant()
    .then(() => {
        console.log('Room is vacant, turn off lights etc...');
    });

//Simulate the office PIR sensor returning a true value
device.get('office-pir').attribute.update('sensor', true);

//Simulate the office PIR sensor returning a false value
device.get('office-pir').attribute.update('sensor', false);
```


### Triggers

#### `.room(name: string).is.occupied()`
When the room is occupied.
```javascript
scenario('Office lights on when occupied')
    .when()
        .room('office').is.occupied()
    .then(() => {
        console.log('Room is occupied, turn on lights etc...');
    });
```

#### `.room(name: string).is.vacant()`
When the room has been set to vacant.
```javascript
scenario('Office lights off when vacant')
    .when()
        .room('office').is.vacant()
    .then(() => {
        console.log('Room is vacant, turn off lights etc...');
    });
```




---




## Scene API

### Management

The `scene` component must be included for management.
```javascript
const { scene } = require('fluent-iot');
```

#### `scene.add(name: string, callback: object)`
Creating a scene that can be referenced and reused in scenarios.
```javascript
scene.add('cool', () => {
    //device.get('light').switchOn()
    console.log('Cool scene activated')
});

scenario('Cool scene')
    .when().empty()
    .then(() => {
        scene.get('cool').run();
    });
```


#### `scene.get(name: string)`
Fetches the scene object.
```javascript
scene.add('cool', () => { console.log('Super cool!') })
console.log(scene.get('cool').name); //"cool"
console.log(scene.get('cool').run()); //"Super cool!"
```


#### `scene.run(name: string)`
Runs a scene.
```javascript
scene.add('cool', () => { console.log('cool') })
console.log(scene.run('cool')); //"cool"
```



---


## Variable API

### Management

The `variable` component must be included for management.
```javascript
const { variable } = require('fluent-iot');
```

#### `variable.set(name: string, value: any, options: Object)`
Setting a variable. Currently there is no state engine in the framework so if the framework is restarted all previous variables are lost.

Variables can expire. Once they expire they are removed and `null` is returned.
```javascript
//Set variable to true
variable.set('security', true);

//Set variable to true and expires in 5 minutes
variable.set('security', true, { expiry:'5 minutes' });

//Set variable to true and expires in 6 hours
variable.set('security', true, { expiry:'6 hours' });
```

#### `variable.remove(name: string)`
Any removed variables will return `null` if `.get()` is used.
```javascript
variable.set('security', true);
console.log(variable.get('security')); //true

variable.remove('security');
console.log(variable.get('security')); //null
```

#### `variable.get(name: string)`
Fetch a variable that has been set.
```javascript
variable.set('security', true);
console.log(variable.get('security')); //true
console.log(variable.get('does not exist')); //null
```


### Triggers

#### `.variable(name: string).is(value: string)`
If a variable is updated to a specific value.
```javascript
scenario('Variable was set to red')
    .when()
        .variable('colour').is('blue')
    .then(() => {
        console.log(`Variable is blue`);
    });
variable.set('colour', 'red');
variable.set('colour', 'blue'');
```

#### `.variable(name: string).updated()`
If a variable is updated to any value.
```javascript
scenario('Variable was updated')
    .when()
        .variable('security').updated()
    .then(() => {
        console.log(`Variable is: ${variable.get('security')}`);
    });
variable.set('security', true);
variable.set('security', false);
```



### Constraints

Variable constraints are an extension of the [Expect API](#expect-api).

```javascript
scenario('Output the level based on variable value updates')
    .when()
        .variable('level').updated()
    .constraint()
        .variable('level').is(1)
        .then(() => { console.log('Level 1'); })
    .constraint()
        .variable('level').contain([ 2, 3, 4 ])
        .then(() => { console.log('Level 2, 3 or 4'); })
    .constraint()
        .variable('level').isGreaterThan(4)
        .then(() => { console.log(`Level is ${variable.get('level')}`); });

variable.set('level', 1);
variable.set('level', 2);
variable.set('level', 3);
variable.set('level', 4);
variable.set('level', 5);
```

---





## Expect API

The expect `component` is based on [Jest's expect](https://jestjs.io/docs/expect) meaning it should be a fimilar syntax to most developers.

Typically expect appends the matchers with `toBe<>`. The matchers can be used with this syntax but for a better context with this framework they start with `is<>`.

#### `is(value)`
Compare values.
```javascript
scenario()
    when().empty()
    constraint()
        .device('pir').attribute('sensor').is('active')
        .then(()=>{})
```

#### `isDefined(value)`
If the value is defined
```javascript
scenario()
    when().empty()
    constraint()
        .device('pir').attribute('sensor').isDefined()
        .then(()=>{})
```

#### `isUndefined(value)`
If the value is undefined
```javascript
scenario()
    when().empty()
    constraint()
        .device('pir').attribute('sensor').isUndefined()
        .then(()=>{})
```

#### `isFalsy(value)`
If the value is a value of falsy
```javascript
scenario()
    when().empty()
    constraint()
        .device('pir').attribute('sensor').isFalsy()
        .then(()=>{})
```

#### `isTruthy(value)`
If the value is a value of truthy
```javascript
scenario()
    when().empty()
    constraint()
        .device('pir').attribute('sensor').isTruthy()
        .then(()=>{})
```

#### `isNull(value)`
If the value is null
```javascript
scenario()
    when().empty()
    constraint()
        .device('pir').attribute('sensor').isNull()
        .then(()=>{})
```

#### `isNaN(value)`
If the value is NaN
```javascript
scenario()
    when().empty()
    constraint()
        .device('pir').attribute('sensor').isNaN()
        .then(()=>{})
```

#### `contain(value)`
If the value is contains a key in an array
```javascript
scenario()
    when().empty()
    constraint()
        .device('led').attribute('colour').contain([ 'red', 'green', 'blue' ])
        .then(()=>{})
```

#### `equal(value)`
Compares recursively all properties of an object.
```javascript
variable.set('deep', [ foo:'bar' ]);
scenario()
    when().empty()
    constraint()
        .variable('deep').equal([ foo:'bar' ])
        .then(()=>{})
```

#### `match(regexp | string)`
Check that a string matches a regular expression
```javascript
scenario()
    when().empty()
    constraint()
        .device('switch').attribute('colour').contain()
        .then(()=>{})
```





## License

Fluent IoT is licenses under a [MIT License](./LICENSE).

