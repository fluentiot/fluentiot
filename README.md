
<h1 align="center">Fluent IoT</h1>
<p align="center">The Programmers IoT Framework</p>

> Fluent IoT is a NodeJS framework designed to streamline IoT development. Offering a fluent and intuitive domain-specific language (DSL), this framework enables developers to craft human-readable scenarios for precise control over IoT devices.

```javascript
scenario('At 6:00pm turn on the gate lights')
    .when()
        .time.is('18:00')
    .then(() => {
        device.get('gate lights').turnOn()
    })
```

* 🤖 Familiar Jest API & BDD patterns
* 🧩 Extensive Trigger & Constraint Library
* 🚀 Seamless Integration with Existing IoT Devices
* 📝 Human-Readable Scenario Creation
* 🛠️ Extensible and Customizable
* ⚖️ Compact and Lightweight


**Important Note:** Fluent IoT is not a graphical user interface (GUI) platform like Home Assistant or similar solutions. It is a framework meant to be integrated into your code. You must already have the ability to both see the state of your IoT devices and interact with them for Fluent to be of any use.

## Connecting IoT Devices

Fluent IoT is designed to work with your own IoT devices. Users are required to connect their devices to the code using the provided `device` component interface.

The codebase comes with a `tuya` component which can serve as an example on other integrations. If you are already using tuya you can configure the access and start using it out of the box.


## Installation

```bash
npm install fluent-iot
```

## Scenario Usage

A scenario is made up of these elements:

### Declaration

```javascript
scenario('Office lights on when PIR is triggered or is 6pm')
```

This sets up a scenario and should explain the purpose of the scenario.

### Trigger

```javascript
.when()
    .time.is('18:00')
```

Triggers that will make the scenario start executing. In this example if the time is 18:00 the following `.constraint()` will be checked.

Multiple triggers act as an "or" and can be useful if a room has multiple PIR sensors.

### Constraints and Actions

```javascript
.constraint()
    .day.is('Weekend')
    .then(() => {
        device.get('officeLights').warmLights()
    })
.else()
    .then(() => {
        device.get('officeLights').dayLights()
    })
```

Multiple constraint groups using the `day` component to decide which `capability` to use for the office lights.

For this to example to work you would need to create a device called "officeLights" with two capabilities, "warmLights" and "dayLights".

### Simple Example

```javascript
scenario('At 6:00pm turn on the office light')
    .when()
        .time.is('18:00')
    .then(() => {
        device.get('officeLights').turnOn()
    })
```

In this example at 6:00pm the office lights are turned on. There are no constraints in this example.

# API

This API includes working examples.

## Contents

-   [Scenario API](#scenario-api)
-   [Day API](#day-api)
-   [Time API](#time-api)
-   [Device API](#device-api)
-   [Capability API](#capability-api)
-   [Event API](#event-api)
-   [Expect API](#expect-api)
-   [Room API](#room-api)
-   [Scene API](#scene-api)
-   [Variable API](#variable-api)
-   [Attributes API](#attributes-api)

---

## Scenario API

#### `scenario(description: string[, properties: object])`
Creating a new scenario with a unique description describing the purpose of the scenario.

The `cooldown` property serves to prevent the occurrence of double-triggering in a scenario. For instance, when utilizing two PIR sensors in a living room, they may be triggered at slightly different times. The presence of a cooldown effectively inhibits the scenario from executing twice in quick succession.

| Property      | Description                 | Default |
| ------------- | --------------------------- | ---- |
| `cooldown`    | Time interval in milliseconds, defining the period during which triggers are temporarily disabled to prevent the execution of actions. | 1000ms (1 sec) |



#### `when()`

Trigger or triggers for the scenario. If multiple triggers are used they act as an "or".

```javascript
//Must create the device before trying to use it in a scenario
device.add('pir');

//Multiple triggers in when() will act as an OR
scenario('18:00, sensor is true or room is occupied')
    .when()
        .time.is('18:00')
        .device('pir').attribute('sensor').isTruthy()
        .room('office').isOccupied()
    .then(() => {})

//While testing using empty() and .assert()
scenario('using empty can be useful for debugging a scenario')
    .when()
        .empty()
    .then(() => {
        console.log('It ran!')
    })
    .assert()
```

#### `.constraint()`

Constraints are optional. Each component has it's own set of constraints and in the examples below they are using the `datetime` component. Multiple constraints can be used, creating constraint groups. Each constraint must have a `then()`.

```javascript
scenario('constraint triggers at 19:00 and checks if weekend')
    .when()
        .time.is('19:00')
    .constraint()
        .day.is('weekend')
        .then(() => {
            console.log('It is the weekend')
        })

scenario('constraint triggers at 19:00 and checks the days')
    .when()
        .time.is('19:00')
    .constraint()
        .day.is(['Mon', 'Tue'])
        .then(() => {
            console.log('Is it Monday or Tuesday')
        })
    .constraint()
        .day.is(['Wed', 'Thur', 'Friday'])
        .then(() => {
            console.log('It is Wednesday, Thursday, or Friday')
        })
    .else()
        .then(() => {
            console.log('Is it the weekend')
        })

scenario('trigger at 19:00 with no constraint checking')
    .when()
        .time.is('19:00')
    .then(() => {
        console.log('Triggered')
    })
```

#### `.then(Scenario, ...args)`

`then()` is used for the actions that will be carried out.

```javascript
scenario('it will output this scenario description')
    .when()
        .empty()
    .then((Scenario) => {
        console.log(`Scenario "${Scenario.description}" triggered`)
    })
    .assert()

scenario('assert and triggers can return args to then()')
    .when()
        .empty()
    .then((_Scenario, colour1, colour2) => {
        console.log(`Colour 1: "${colour1}"`) //red
        console.log(`Colour 2: "${colour2}"`) //green
    })
    .assert('red', 'green')
```


### Testing scenarios

If a scenario is failing, one of the first steps is to investigate if it fails when it's the only scenario running. To run only one scenario temporarily modify its command to scenario.only within the relevant code block.

```javascript
scenario.only('this is the only scenario that will run')
    .when()
        .time.is('18:00')
    .then(() => { console.log('it ran') })
event.emit('time', '18:00')
```

To skip the triggers entirely use an `assert`.
```javascript
scenario.only('this is the only scenario that will run')
    .when()
        .time.is('18:00')
    .then(() => { console.log('it ran') })
    .assert()
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
        .then(() => {
            console.log('It is 7am Saturday ')
        })
    .else()
        .then(() => { console.log('It is 7am but not Saturday'); })
    .assert()
```

### Constraints

#### `.day.is(string | array)`

Supports a single argument or multiple arguments for multiple days.

Supported arguments: `weekend, weekday, monday, mon, tuesday, tue, wednesday, wed, thursday, thu, friday, fri, saturday, sat, sunday, sun`.

```javascript
scenario('Only on a Saturday')
    .when()
        .empty()
    .constraint()
        .day.is('Saturday')
        .then((Scenario) => {
            console.log(Scenario.description)
        })
    .assert()

scenario('Saturday or Monday')
    .when()
        .empty()
    .constraint()
        .day.is(['Saturday', 'mon'])
        .then((Scenario) => {
            console.log(Scenario.description)
        })
    .assert()

scenario('Weekends or weekdays')
    .when()
        .empty()
    .constraint()
        .day.is('weekend')
        .then(() => {
            console.log('It is the weekend')
        })
    .constraint()
        .day.is('weekday')
        .then(() => {
            console.log('It is weekday')
        })
    .assert()
```

#### `.day.between(start: string, end: string)`

Checking if the current date is between two dates.

```javascript
scenario('First week of May')
    .when()
        .empty()
    .constraint()
        .day.between('1st May', '7th May')
        .then((Scenario) => {
            console.log(Scenario.description)
        })
    .assert()

scenario('Christmas lights!')
    .when()
        .empty()
    .constraint()
        .day.between('Dec 20', 'Dec 31')
        .then((Scenario) => {
            console.log(Scenario.description)
        })
    .assert()

scenario('Only May 2024')
    .when()
        .empty()
    .constraint()
        .day.between('2024-05-01', '2024-05-31')
        .then((Scenario) => {
            console.log(Scenario.description)
        })
    .assert()
```

| Date Format   | Description                                       |
| ------------- | ------------------------------------------------- |
| `1st May`      | Represents a specific day and month.              |
| `5 May`        | Represents a specific day in May.                 |
| `May 5th`      | Represents a specific day in May.                 |
| `May 5`        | Represents a specific day and month.              |
| `2023-12-31`   | Represents a specific date in the YYYY-MM-DD format. |
| `January 15`   | Represents a specific day in January.             |
| `15th January` | Represents a specific day in January.             |
| `12/31/2023`   | Represents a specific date in MM/DD/YYYY format.  |
| `31 Dec 2023`  | Represents a specific date in DD MMM YYYY format. |
| `Dec 31 2023`  | Represents a specific date in MMM DD YYYY format. |


---

## Time API

The Time component in Fluent IoT allows you to incorporate time-related functionalities into your IoT scenarios. It supports triggers such as the current time and repeating schedules.

### Triggers

#### `.time.is(time: string)`

If the time is matching, must be in `HH:mm` format.

```javascript
scenario('Time is 7am')
    .when()
        .time.is('07:00')
    .then((Scenario) => {
        console.log(Scenario.description)
    })
```

To simulate time you can emit an event using the `event` component that will trigger the scenario.

```javascript
//Manually emit the time for testing
event.emit('time', '07:00')
```

#### `.time.every(expression: string)`

Repeating the trigger at set intervals.
Supports seconds (`sec, second, seconds`), minutes (`min, minute, minutes`) and hours (`hr, hour, hours`). If an invalid format is entered an error will be thrown.

```javascript
scenario('Triggers every second')
    .when()
        .time.every('1 second')
    .then((Scenario) => {
        console.log(Scenario.description)
    })

scenario('Triggers 2 minutes')
    .when()
        .time.every('2 min')
    .then((Scenario) => {
        console.log(Scenario.description)
    })

scenario('Triggers 12 hours')
    .when()
        .time.every('12 hr')
    .then((Scenario) => {
        console.log(Scenario.description)
    })
```

### Constraints

#### `.time.between(start_time: string, end_time: string)`

Checking if the scenario was triggered between two times. It can also support times crossing over midnight.

```javascript
scenario('Between times')
    .when()
        .empty()
    .constraint()
        .time.between('05:00', '12:00')
        .then(() => {
            console.log('Good Morning')
        })
    .constraint()
        .time.between('12:01', '18:00')
        .then(() => {
            console.log('Good Afternoon')
        })
    .constraint()
        .time.between('18:01', '23:00')
        .then(() => {
            console.log('Good Evening')
        })
    .constraint()
        .time.between('23:01', '04:59')
        .then(() => {
            console.log('Crossing over midnight')
        })
    .assert()
```

### Events

| Event         | Description                 | Data |
| ------------- | --------------------------- | ---- |
| `time`        | Current time HH:mm format   | -    |
| `time.hour`   | Every hour, on the hour     | -    |
| `time.minute` | Every minute, on the minute | -    |
| `time.second` | Every second                | -    |

Example using the `event` component directly.

```javascript
scenario('At 6pm every day')
    .when()
        .event('time').on('18:00')
    .then(() => {
        console.log('It is 6pm')
    })

scenario('Runs every hour')
    .when()
        .event('time.hour').on()
    .then(() => {
        console.log('It is on the hour')
    })

scenario('Runs every minute')
    .when()
        .event('time.minute').on()
    .then(() => {
        console.log('On the minute')
    })

scenario('Runs every second')
    .when()
        .event('time.second').on()
    .then(() => {
        console.log('Every second')
    })
```

---

## Device API

### Management

The `device` and typically `capability` components must be included for management.

```javascript
const { device, capability } = require('fluent-iot')
```

#### `device.add(name: string, attributes: object, capabilities: array)`
Create a new IoT device. All your IoT devices, from switches, buttons, lights etc.. must have a device so you can interact with them and update their state.
```javascript
//Creating a basic device
device.add('kitchenSwitch')
```

Understanding the concept of IoT state provides clarity in device behavior. For instance, a switch, with a defined state (on or off), contrasts with a button, which lacks a persistent state and can be pressed multiple times, consistently triggering the same action. By default, devices are stateful. However, for buttons, setting them as stateless (`stateful: false`) is necessary. If a button is not explicitly set as stateless, it will respond to a single press only.

This is useful to avoid loopbacks.

```javascript
device.add('kitchenSwitch');
device.add('kitchenButton', { stateful: false })
```

Example of adding devices with capabilities.
```javascript
//Adding a device with default attributes
device.add('kitchenKettle', { id: 'Xyz', group: 'kettle' })

//Add on and off capabilities using the @ reference
capability.add('on', () => {
    console.log('On!')
})
capability.add('off', () => {
    console.log('Off!')
})
device.add('kitchenLight', {}, ['@on', '@off'])

//Adding warm capability
const warm = capability.add('warm', () => {
    console.log('Warm!')
})
device.add('officeLight', {}, ['@on', '@off', '@warm'])

//Using the device capabilities
device.get('kitchenLight').on()
device.get('kitchenLight').off()

device.get('officeLight').on()
device.get('officeLight').off()
device.get('officeLight').warm()
```

#### `device.get(name: string)`

Fetching a device.

```javascript
//Basic add and get
device.add('kitchenLight')
const kitchenLight = device.get('kitchenLight')
console.log(kitchenLight)

//Fetching a device attribute
device.add('officeSwitch', { id: 'Abc' })
console.log(device.get('officeSwitch').attribute.get('id'))
```

#### `device.findOneByAttribute(attributeName: string, attributeValue: any)`

Query an individual device based on a specific attribute and its corresponding value.

```javascript
//Capability for the switch
capability.add('switchOn', (device) => {
    const deviceId = device.attribute.get('id')
    console.log(`Make API call to Tuya to switch device ${deviceId} on`)
})

device.add('officeLedMonitor', { id: '111' }, ['@switchOn'])

//Switch this device on
const matchedDevice = device.findOneByAttribute('id', '111')
matchedDevice.switchOn()
```



#### `device.findAllByAttribute(attributeName: string, attributeValue: any)`

Query devices based on a specific attribute and its corresponding value.

```javascript
//Capability for the switch
capability.add('switchOn', (device) => {
    const deviceId = device.attribute.get('id')
    console.log(`Make API call to Tuya to switch device ${deviceId} on`)
})

//Grouped devices
device.add('officeLedMonitor', { id: '111', group: 'office' }, ['@switchOn'])
device.add('officeLedDesk', { id: '222', group: 'office' }, ['@switchOn'])

//Switch on devices that match this attribute group value
const devices = device.findAllByAttribute('group', 'office')
devices.forEach((currentDevice) => {
    currentDevice.switchOn()
})
```

### Triggers

Device triggers are an extension of the [Attributes DSL](#attributes-api) and [Expect DSL](#expect-api).

#### `.device(name: string).attribute(attributeName: string).is(value: any)`

If a devices attribute is updated to true

```javascript
device.add('officeSwitch', { state: false })

scenario('Detect when a switch is turned on')
    .when()
        .device('officeSwitch').attribute('state').isTruthy()
    .then(() => {
        console.log('Office switch is now on')
    })

//Attribute updated by IoT gateway
device.get('officeSwitch').attribute.set('state', true)
```

### Events

| Event                            | Description              | Data                                               |
| -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device.[device name].attribute` | Device attribute updated | `{ name:"attributeName", value:"attributeValue" }` |

---

## Capability API

Capabilities are exclusive to devices within the Fluent IoT framework.

Consider an LED light that possesses various capabilities, such as turning on, turning off, or changing colors like red, green, and blue. Similarly, a switch may have the capability to be toggled on or off. However, it's crucial to note that a PIR sensor, being an informational device, does not typically have a sensor capability. In the context of Fluent IoT, capabilities are methods used to interact with IoT devices rather than accessing the information they provide.

Capabilities can be shared across multiple devices making it a reusable component. It is also serves as a bridge from the framework to your IoT service device manager.

### Management

The `capability` component must be included for management.

When referencing capabilities in devices prefix the capability with an `@` symbol.

```javascript
const { capability } = require('fluent-iot')
```

#### `capability.add(name: string, object: callback)`

Creation of a new reusable capability.

```javascript
capability.add('lightOff', () => {
    console.log('Light off!')
})
device.add('officeLight', {}, ['@lightOff'])
device.get('officeLight').lightOff()
```

More advanced usage showing reusability.

```javascript
//Capability for the switch
capability.add('switchOn', (device) => {
    const deviceId = device.attribute.get('id')
    console.log(`Make API call to Tuya to switch device ${deviceId} on`)
})

//Devices with switchOn capability
device.add('officeLedMonitor', { id: 'tuya-id-111' }, ['@switchOn'])
device.add('officeLedDesk', { id: 'tuya-id-222' }, ['@switchOn'])

device.get('officeLedMonitor').switchOn()
device.get('officeLedDesk').switchOn()
```

---

## Event API

The `event` component is the central bus for all triggers. It uses the native [NodeJS event emitter](https://nodejs.org/api/events.html) and aliases `emit` and `on`.

### Management

The `event` component must be included for management.

```javascript
const { event } = require('fluent-iot')
```

#### `.event.emit(eventName: string[, ...args]);`

See official [emit documentation](https://nodejs.org/api/events.html#emitteremiteventname-args).

```javascript
scenario('Lock down when receiving lockdown event')
    .when()
        .event('lockdown').on(true)
    .then(() => {
        console.log('Locking down')
    })
event.emit('lockdown', true)
```

#### `.event.on(eventName: string);`

See official [emit documentation](https://nodejs.org/api/events.html#emitteroneventname-listener).

```javascript
event.on('lockdown', () => {
    console.log('Locking down!')
})
event.emit('lockdown', true)
```

### Triggers

#### `.event(name: string).on(value: any)`

When an event is emitted with a specific value.

```javascript
scenario('Lock down when event is detected')
    .when()
        .event('lockdown').on(true)
    .then(() => {
        console.log('Lock down!')
    })
event.emit('lockdown', true)
```

#### `.event(name: string).on()`

When an event is emitted, no matter the value

```javascript
scenario('Pretty colours')
    .when()
        .event('colour').on()
    .then((_Scenario, colour) => {
        console.log(`Pretty colour: ${colour}`)
    })
event.emit('colour', 'red')
event.emit('colour', 'green')
event.emit('colour', 'blue')
```

---

## Room API

Rooms serve as a component for managing room occupancy, especially when relying on a PIR sensor's state may not be entirely reliable. In scenarios where a person is present in a room but not actively moving, the sensor may send a "false" signal. The room component introduces a time threshold that helps mitigate the impact of such "false" signals, allowing for a more accurate determination of room vacancy.

It is important to read the `updatePresence` API to understand how to fully manage occupancy.

### Management

The `room` component must be included for management.

```javascript
const { room } = require('fluent-iot')
```

#### `room.add(name: string, attributes: object)`

Creates a new room that can be used for monitoring occupancy.
See `updatePresence()` API to update the occupancy.

```javascript
//Office room with no default attributes
room.add('office')
console.log(room.get('office').isOccupied()) //False

//Living room with default attribute of occupied
room.add('living', { occupied: true })
console.log(room.get('living').isOccupied()) //True

//Updating the default duration to be occupied after receiving a 'false' occupancy sensor value
const playroom = room.add('playroom', { thresholdDuration: 5 })
```

#### `room.get(name: string)`

Get a room by its name. If the room does not exist it will return `null`.

```javascript
//Using the .get() API
room.add('office')
console.log(room.get('office').name) //"office"

//Direct
const living = room.add('living')
console.log(living.name) //"living"
```

#### `room.get(name: string).isOccupied()`

Returns `true` if occupied or `false` if vacant.

```javascript
const office = room.add('office')

office.attribute.set('occupied', true)
console.log(office.isOccupied()) //true

office.attribute.set('occupied', false)
console.log(office.isOccupied()) //false
```


#### `room.get(name: string).addPresenceSensor(device: Device, expectedKey: string, expectedValue:string)`
Adding an existing sensor to a room for presence detection. This is a preferred method than using the more manual `updatePresence`.

```javascript
const livingPir = device.add('livingPir')
const living = room.add('living')
living.addPresenceSensor(livingPir, 'pir', true)
```

In the above example this will listen to the attribute `pir` for the `livingPir` device. If the attribute is updated to `true` the room presence will be updated. If the value is anything other than `true`, e.g. `false` then the presence is updated and the room `thresholdDuration` will update the occupancy.

```javascript
const livingPir = device.add('livingPir')
const living = room.add('living', { thresholdDuration: 0 })
living.addPresenceSensor(livingPir, 'sensor', true)

scenario('Living lights on when occupied')
    .when()
        .room('living').isOccupied()
    .then(() => {
        console.log('Room is occupied, turn on lights etc...')
    })

scenario('Living lights off when vacant')
    .when()
        .room('living').isVacant()
    .then(() => {
        console.log('Room is vacant, turn off lights etc...')
    })

//Simulate the office PIR sensor returning a true value
livingPir.attribute.update('sensor', true)

//Simulate the office PIR sensor returning a false value
livingPir.attribute.update('sensor', false)
```




#### `room.get(name: string).updatePresence(sensorValue: boolean)`

The presence should be called on a room sensor's value (e.g. PIR sensor). This will use the `thresholdDuration` option used in the `room.add()` API.

This method is a more manual method. It's recommended to use `addPresenceSensor` method if possible.

```javascript
// The default thresholdDuration is 15 minutes
room.add('living')

// After 5 minutes of the room not having a positive sensor value the room will become vacant
room.add('office', { thresholdDuration: 5 })

// To ignore the threshold set it to 0
room.add('pantry', { thresholdDuration: 0 })
```

Using this API with a scenario and simulating device updates.

```javascript
room.add('office', { thresholdDuration: 5 })
device.add('officePir')

//Listening to PIR updates
scenario('Office PIR sensor with movement and update presence')
    .when()
        .device('officePir').attribute('sensor').is(true)
    .then(() => {
        room.get('office').updatePresence(true)
        console.log(room.get('office').isOccupied()) //true
        //.room('office').is.occupied() trigger will be called
    })

scenario('Office PIR sensor with no movement')
    .when()
        .device('officePir').attribute('sensor').is(false)
    .then(() => {
        room.get('office').updatePresence(false)
        console.log(room.get('office').isOccupied()) //true
        //...in 5 minutes:
        //.isOccupied() will be false
        //.room('office').is.vacant() trigger will be called
    })

//Listening to occupancy updated
scenario('Office lights on when occupied')
    .when()
        .room('office').isOccupied()
    .then(() => {
        console.log('Room is occupied, turn on lights etc...')
    })

scenario('Office lights off when vacant')
    .when()
        .room('office').isVacant()
    .then(() => {
        console.log('Room is vacant, turn off lights etc...')
    })

//Simulate the office PIR sensor returning a true value
device.get('officePir').attribute.update('sensor', true)

//Simulate the office PIR sensor returning a false value
device.get('officePir').attribute.update('sensor', false)
```

### Triggers

#### `.room(name: string).isOccupied()`

When the room is occupied.

```javascript
room.add('office')
scenario('Office lights on when occupied')
    .when()
        .room('office').isOccupied()
    .then(() => {
        console.log('Room is occupied, turn on lights etc...')
    })
```

#### `.room(name: string).isVacant()`

When the room has been set to vacant.

```javascript
room.add('office')
scenario('Office lights off when vacant')
    .when()
        .room('office').isVacant()
    .then(() => {
        console.log('Room is vacant, turn off lights etc...')
    })
```


### Constraints

#### `.room(name: string).isOccupied()`
Checking if the room is occupied.
```javascript
const office = room.add('office')
office.updatePresence(true)
scenario('Says good morning if the room is occupied')
    .when()
        .empty()
    .constraint()
        .room('office').isOccupied()
        .then(() => {
            console.log('Good Morning')
        })
    .else()
        .then(() => {
            console.log('Office is vacant')
        })
    .assert()
```



#### `.room(name: string).isVacant()`
Checking if the room is vacant.
```javascript
// Rooms are automatically set to "vacant" state on creation.
const office = room.add('office')
scenario('Checking if vacant')
    .when()
        .empty()
    .constraint()
        .room('office').isVacant()
        .then(() => {
            console.log('Empty room')
        })
    .assert()
```


---

## Scene API

### Management

The `scene` component must be included for management.

```javascript
const { scene } = require('fluent-iot')
```

#### `scene.add(name: string, callback: object)`

Creating a scene that can be referenced and reused in scenarios.

```javascript
scene.add('cool', () => {
    //device.get('light').switchOn()
    console.log('Cool scene activated')
})

scenario('Cool scene')
    .when()
        .empty()
    .then(() => {
        scene.get('cool').run()
    })
```

#### `scene.get(name: string)`

Fetches the scene object.

```javascript
scene.add('cool', () => {
    console.log('Super cool!')
})
console.log(scene.get('cool').name) //"cool"
scene.get('cool').run() //"Super cool!"
```

#### `scene.run(name: string)`

Runs a scene.

```javascript
scene.add('cool', () => {
    console.log('cool')
})
scene.run('cool') //"cool"
```

---

## Variable API

### Management

The `variable` component must be included for management.

```javascript
const { variable } = require('fluent-iot')
```

#### `variable.set(name: string, value: any, options: Object)`

Setting a variable. Currently there is no state engine in the framework so if the framework is restarted all previous variables are lost.

Variables can expire. Once they expire they are removed and `null` is returned.

```javascript
//Set variable to true
variable.set('security', true)

//Set variable to true and expires in 5 minutes
variable.set('security', true, { expiry: '5 minutes' })

//Set variable to true and expires in 6 hours
variable.set('security', true, { expiry: '6 hours' })
```

#### `variable.remove(name: string)`

Any removed variables will return `null` if `.get()` is used.

```javascript
variable.set('security', true)
console.log(variable.get('security')) //true

variable.remove('security')
console.log(variable.get('security')) //null
```

#### `variable.get(name: string)`

Fetch a variable that has been set.

```javascript
variable.set('security', true)
console.log(variable.get('security')) //true
console.log(variable.get('does not exist')) //null
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
variable.set('colour', 'blue');
```

#### `.variable(name: string).updated()`

If a variable is updated to any value.

```javascript
scenario('Variable was updated')
    .when()
        .variable('security').updated()
    .then(() => {
        console.log(`Variable is: ${variable.get('security')}`)
    })
variable.set('security', true)
variable.set('security', false)
```

### Constraints

Variable constraints are an extension of the [Expect API](#expect-api).

```javascript
scenario('Output the level based on variable value updates')
    .when()
        .variable('level').updated()
    .constraint()
        .variable('level').is(1)
        .then(() => {
            console.log('Level 1')
        })
    .constraint()
        .variable('level').contain([2, 3, 4])
        .then(() => {
            console.log('Level 2, 3 or 4')
        })
    .constraint()
        .variable('level').isGreaterThan(4)
        .then(() => {
            console.log(`Level is ${variable.get('level')}`)
        })

variable.set('level', 1)
variable.set('level', 2)
variable.set('level', 3)
variable.set('level', 4)
variable.set('level', 5)
```

---

## Expect API

The expect `component` is based on [Jest's expect](https://jestjs.io/docs/expect) meaning it should be a fimilar syntax to most developers.

Typically expect appends the matchers with `toBe<>`. The matchers can be used with this syntax but for a better context with this framework they start with `is<>`.

#### `is(value)`

Compare values.

```javascript
scenario('is')
    .when()
        .empty()
    .constraint()
        .device('pir').attribute('sensor').is('active')
        .then(() => { console.log('Is') })
        .assert()
```

#### `isDefined(value)`

If the value is defined

```javascript
scenario('is defined')
    .when()
        .empty()
    .constraint()
        .device('pir').attribute('sensor').isDefined()
        .then(() => { console.log('Is defined') })
```

#### `isUndefined(value)`

If the value is undefined

```javascript
scenario('is undefined')
    .when()
        .empty()
    .constraint()
        .device('pir').attribute('sensor').isUndefined()
        .then(() => { console.log('Is undefined') })
```

#### `isFalsy(value)`

If the value is a value of falsy

```javascript
scenario('is falsy')
    .when()
        .empty()
    .constraint()
        .device('pir').attribute('sensor').isFalsy()
        .then(() => { console.log('Is Falsy') })
```

#### `isTruthy(value)`

If the value is a value of truthy

```javascript
scenario('is truthy')
    .when()
        .empty()
    .constraint()
        .device('pir').attribute('sensor').isTruthy()
        .then(() => { console.log('Is Truthy') })
```

#### `isNull(value)`

If the value is null

```javascript
scenario('is null')
    .when()
        .empty()
    .constraint()
        .device('pir').attribute('sensor').isNull()
        .then(() => { console.log('Is Null') })
```

#### `isNaN(value)`

If the value is NaN

```javascript
scenario('is NaN')
    .when()
        .empty()
    .constraint()
        .device('pir').attribute('sensor').isNaN()
        .then(() => { console.log('Is NaN') })
```

#### `contain(value)`

If the value is contains a key in an array

```javascript
scenario('contains')
    .when()
        .empty()
    .constraint()
        .device('led').attribute('colour').contain(['red', 'green', 'blue'])
        .then(() => { console.log('Contains') })
```

#### `equal(value)`

Compares recursively all properties of an object.

```javascript
variable.set('deep', [ foo:'bar' ]);
scenario('equal')
    .when()
        .empty()
    .constraint()
        .variable('deep').equal([ foo:'bar' ])
        .then(()=>{ console.log('Deep equal') })
```

#### `match(regexp | string)`

Check that a string matches a regular expression

```javascript
scenario('matches')
    .when()
        .empty()
    .constraint()
        .device('switch').attribute('colour').contain()
        .then(() => { console.log('Matches') })
```

## License

Fluent IoT is licenses under a [MIT License](./LICENSE).
