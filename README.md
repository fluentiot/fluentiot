
<h1 align="center">Fluent IoT</h1>
<p align="center">The Programmers IoT Framework</p>

> Fluent IoT is an experimental NodeJS IoT framework designed to give you as much control with your IoT development whilst maintaining DRY principles. Offering a fluent and intuitive domain-specific language (DSL), this framework enables developers to craft human-readable scenarios for precise control over IoT devices.

```javascript
scenario('At 6:00pm turn on the gate lights')
    .when()
        .time.is('18:00')
    .then(() => {
        device.get('gateLights').turnOn()
    })
```

* 🤖 Familiar Jest API & BDD patterns
* 🧩 Trigger & Constraint Library
* 🚀 Seamless Integration with Existing IoT Devices
* 📝 Human-Readable Scenario Creation
* 🛠️ Extensible and Customizable
* ⚖️ Compact and Lightweight


**Important Note:** Fluent IoT is not a graphical user interface (GUI) platform like Home Assistant or similar solutions. It is a framework meant to be integrated into your code. You must already have the ability to both see the state of your IoT devices and interact with them for Fluent to be of any use.

## Connecting IoT Devices

Fluent IoT is designed to work with your own IoT devices. Users are required to connect their devices to the code using the provided `device` component interface.

The codebase comes with a `tuya` component which can serve as an example on other integrations. If you are already using tuya you can configure the access and start using it out of the box. Guide on getting started with Tuya is documented below.


## Getting Started

### Installation

```bash
# Install fluentiot module
npm install fluentiot

# Copy the config file
cp ./node_modules/fluentiot/fluent.config.js .

# Create entry file
touch index.js
```


### Setting up Tuya

This only applies if you are already using Tuya devices. The setup is similar to [Home Assistant Tuya Integration](https://www.home-assistant.io/integrations/tuya/).

Once you have created a Cloud project edit the `fluent.config.js` and enter the information under the `tuya` key.

#### Testing the connection
To test the connection run the following script.

```bash
node node_modules/fluentiot/tools/tuya_openapi_tester.js
```

#### Monitoring for first IoT device update
In `fluent.config.js` uncomment the "tuya" component.
It's typically a good idea to start testing with an IoT button.

```javascript
// index.js
const { tuya } = require('fluentiot')
tuya.start()
```

Run the app, it will make a connection to Tuya and if successful will start showing IoT device updates.
Devices will be shown as "Unknown" unless they have been mapped with `device`.

```bash
Device "Unknown" (eb71d1838f9911d53a5jay) sent a payload: {"1":"single_click","code":"switch1_value","t":1704519397,"value":"single_click"}
```

#### Building first scenario
Now we have the button device id (`eb71d1838f9911d53a5jay`) and the payload we can construct the first scenario.

```javascript
// index.js
const { tuya, device, scenario } = require('fluentiot')

// Create button with the ID and make sure it's stateless (a switch will be stateful)
device.add('button', { id:'eb71d1838f9911d53a5jay', stateful: false })

// Based on the payload we can now listen to the device update
scenario('button pressed')
    .when()
        .device('button').attribute('switch1_value').is('single_click')
    .then(() => {
        console.log('button pressed')
    })

// Start tuya connection
tuya.start()
```

Restarting the app and pressing the button should output "button pressed" if everything was entered correctly.
Pay attention to the payload received as there are many inconsistencies between Tuya devices.


#### Turning on and off a light with the button

The next example will use the Tuya connection, the button and your IoT light.

Components used are:

| Component      | Description                 |
| ------------- | --------------------------- |
| `tuya`  | To connect to tuya cloud to send and receive commands to your IoT devices |
| `device`  | Creation of devices referencing your Tuya id's |
| `capability`  | Giving the ability for a device to send a command to Tuya |
| `scenario`  | Create a test routine |
| `variable`  | Using a true/false variable for testing |
| `logger`  | To log the output in a standard format |

```javascript
const { tuya, device, capability, scenario, variable, logger } = require('fluentiot')

// Create two capabilities for light on and off
// These can be shared by other devices if they share the same tuya properties
capability.add('lightOn', (device) => {
    tuya.send(device.attribute.get('id'), { "switch_led": true }, { version:'v2.0' })
});
capability.add('lightOff', (device) => {
    tuya.send(device.attribute.get('id'), { "switch_led": false }, { version:'v2.0' })
});

// Add the light device with the two capabilities
device.add('light', { id:'eb69e23aedfb73b6f5wbt0' }, [ '@lightOn', '@lightOff' ])

// Add the button device
device.add('button', { id:'eb71d1838f9911d53a5jay', stateful: false })

// Create the scenario and include suppressFor so that the scenario can be triggered again without delay
scenario('button pressed', { suppressFor: 0 })
    .when()
        .device('button').attribute('switch1_value').is('single_click')
    .constraint()
        .variable('flipflop').is(false)
        .then(() => {
            logger.info('Setting light to on')
            variable.set('flipflop', true)
            device.get('light').lightOn()
        })
    .else()
        .then(() => {
            logger.info('Setting light to off')
            variable.set('flipflop', false)
            device.get('light').lightOff()
        })

tuya.start()
```



### Conclusion

Once you know how to get the device updates and interact with the devices typically the rest is to meat out the scenarios using Fluent IoT framework to your preferences.




### Recommended structure

Example of `index.js`

```javascript
// index.js
const { tuya } = require('fluentiot');

// Setup
require('./app/setup/rooms');
require('./app/setup/capabilities');
require('./app/setup/devices');

// Scenarios
require('./app/scenarios/living');
require('./app/scenarios/office');
require('./app/scenarios/pantry');

// Start some services
tuya.start()
```

Recommended directory structure.

```bash
./index.js
./app/scenarios/
        /living.js
        /office.js
        /pantry.js
./app/setup/
        /capabilities.js
        /devices.js
        /rooms.js
```





## Scenario

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
-   [Attributes DSL API](#attributes-dsl-api)
-   [Query DSL API](#query-dsl-api)
-   [Logging API](#Logging-api)

---

## Scenario API

### `scenario(description: string[, properties: object])`
Creating a new scenario with a unique description describing the purpose of the scenario.


| Property      | Description                 | Default |
| ------------- | --------------------------- | ---- |
| `suppressFor`    | Time interval defining the period during which triggers are temporarily disabled to prevent the execution of actions. | 10 seconds |


#### Suppressing scenario
The `suppressFor` property serves a dual role, offering enhanced control and mitigating the risk of double-triggering in scenarios.

The first purpose is to have more control over your scenarios. An example would be to only run a scenario once a day.

The second purpose is to prevent the occurrence of double-triggering. For instance, when utilizing two PIR sensors in a living room, they may be triggered at slightly different times. The presence of a suppressFor effectively inhibits the scenario from executing twice in quick succession.

The value supports patterns for utility method `addDurationToNow`.

```
10 ms/millisecond/milliseconds
10 sec/second/seconds
10 min/minute/minutes
10 hr/hour/hours
```



### `when()`

Trigger or triggers for the scenario. If multiple triggers are used they act as an "or".

```javascript
// Include device and room
const { room, device } = require('fluentiot')

// Must create the device and room
device.add('pir')
room.add('office')

// Multiple triggers in when() will act as an OR
scenario('18:00, sensor is true or room is occupied')
    .when()
        .time.is('18:00')
        .device('pir').attribute('sensor').is(true)
        .room('office').isOccupied()
    .then(() => {})

// While testing using empty() and .assert()
scenario('using empty can be useful for debugging a scenario')
    .when()
        .empty()
    .then(() => {
        console.log('It ran!')
    })
    .assert()
```

### `.constraint()`

Constraints are optional. Each component has it's own set of constraints and in the examples below they are using the `datetime` component. Multiple constraints can be used, creating constraint groups. Each constraint must have a `then()`.

To test these examples add `.assert()` to the last chain of `scenario` call.

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

const s = scenario('assert and triggers can return args to then()')
    .when()
        .empty()
    .then((_Scenario, colour1, colour2) => {
        console.log(`Colour 1: "${colour1}"`) //red
        console.log(`Colour 2: "${colour2}"`) //green
    })
s.assert('red', 'green')
```


### Fetching a scenario by description
Using `Fluent` you can fetch the scenario by its description.
`Fluent.scenario` includes a mixin of the [Query DSL](#query-dsl-api). Fetching and asserting other scenarios can be useful for more nuanced routines. 

```javascript
scenario('fetch and run this')
    .when()
        .empty()
    .then(() => console.log('It ran!'))

Fluent.scenario.get('fetch and run this').assert()
```



### Suppress a scenario

Suppressing a scenario ad-hoc is useful when you want to prevent a scenario from being triggered for a certain period of time. This can be particularly helpful in IoT setups, such as preventing a motion sensor from re-triggering a light switch right after it has been turned off, giving you time to leave the room without the light turning back on.

```javascript
scenario('foobar')
    .when()
        .empty()
    .then(() => console.log('It ran!'))

// Fetch the scenario by description
s = Fluent.scenario.get('foobar')

// Suppress for 10 seconds
s.suppressFor('10 seconds')

// Assert will not run the scenario until 10 seconds has passed
s.assert()

// Reset the adhoc suppression
s.suppressFor(false)
```




### Testing & debugging scenarios

There are multiple ways to build and test a scenario.

1. Using the `scenario.only()` so only this scenario runs
2. Emitting events manually to trigger scenarios
3. Using the `.assert()` method in the chain to force run

```javascript
const { scenario, event } = require('fluentiot')

scenario.only('this is the only scenario that will run')
    .when()
        .time.is('18:00')
    .then(() => console.log('it ran'))

event.emit('time', '18:00')
```

To skip the triggers entirely use an `assert`.
```javascript
scenario('skipping the triggers using assert')
    .when()
        .time.is('18:00')
    .then(() => console.log('it ran'))
    .assert()
```


### Asynchronous actions

To handle asynchronous add `async` to the `then` method.

```javascript
.then(() => {}) // To...
.then(async () => {})
```

An example using the `delay` utility and `async`.
```javascript
const { scenario, utils } = require('fluentiot')

scenario('Countdown')
    .when()
        .empty()
    .then(async () => {
        console.log('3')
        await utils.delay(1000)
        console.log('2')
        await utils.delay(1000)
        console.log('1')
        await utils.delay(1000)
        console.log('Go!')
    })
    .assert()
```


---

## Day API

FluentIoT primarily uses [dayjs](https://github.com/iamkun/dayjs) for handling dates. For testing it's preferable to use [mockdate](https://github.com/boblauer/MockDate) to manipulate the date.

### Methods

#### `day.is(targetDay: string | array)`
Supports a single argument or multiple arguments for multiple days.

Supported values: `weekend, weekday, monday, mon, tuesday, tue, wednesday, wed, thursday, thu, friday, fri, saturday, sat, sunday, sun`.

```javascript
const { day } = require('fluentiot')
console.log(day.is('Monday') ? 'It is Monday' : 'It is not Monday')
console.log(day.is(['Sat','Sun']) ? 'Weekend' : 'Weekday')
```



#### `day.between(targetStart: string, targetEnd: string)`
Returns `true` or `false` if the current date is between two other dates.

```javascript
day.between('1st May', '7th May')
day.between('2024-05-01', '2024-05-31')

// Will check over multiple years
day.between('Dec 20', 'Jan 2')
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


### Triggers

Day currently has no triggers so it's perferable to use `time` API mixed with `day` constraint.

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




---

## Time API

The Time component in Fluent IoT allows you to incorporate time-related functionalities into your IoT scenarios. It supports triggers such as the current time and repeating schedules.

### Methods

#### `time.between(start_time: string, end_time: string)`

Checking if the scenario was triggered between two times. It can also support times crossing over midnight.

```javascript
time.between('05:00', '12:00')
time.between('23:01', '04:59')
```



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
// suppressFor param set to 0 so the call is not throttled
scenario('Triggers every second', { suppressFor:0 })
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

#### `.time.is(solar_time: string)` - Solar Times

Fluent IoT supports solar-based time triggers using the SunCalc library. You can trigger scenarios based on astronomical events like sunrise, sunset, dawn, and dusk.

**Supported Solar Times:**
- `sunrise` - Sun appears above the horizon
- `sunset` - Sun disappears below the horizon  
- `dawn` - Morning civil twilight starts
- `dusk` - Evening civil twilight starts
- `nauticalDawn` - Morning nautical twilight starts
- `nauticalDusk` - Evening nautical twilight starts
- `nightEnd` - Night ends (morning astronomical twilight starts)
- `night` - Night starts (evening astronomical twilight starts)
- `goldenHour` - Evening golden hour starts
- `goldenHourEnd` - Morning golden hour ends

```javascript
scenario('Turn on garden lights at sunset')
    .when()
        .time.is('sunset')
    .then(() => {
        device.get('gardenLights').turnOn()
    })

scenario('Turn off security lights at sunrise')
    .when()
        .time.is('sunrise')
    .then(() => {
        device.get('securityLights').turnOff()
    })

scenario('Close blinds at dusk')
    .when()
        .time.is('dusk')
    .then(() => {
        device.get('livingRoomBlinds').close()
    })
```

**Location Configuration:**
Solar times are calculated based on your geographical location. By default, Fluent IoT uses Bangkok, Thailand coordinates. To set your location, add the following to your `fluent.config.js`:

```javascript
const config = {
    location: {
        latitude: 40.7128,   // Your latitude
        longitude: -74.0060  // Your longitude (New York City example)
    },
    // ...existing config
}
```

You can also programmatically update the location:

```javascript
const { time } = require('fluentiot')
time.setLocation(40.7128, -74.0060) // Latitude, Longitude
```

### Constraints

#### `.time.between(start_time: string, end_time: string)`

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
| `solar`       | Solar time events           | Solar event name (e.g., 'sunrise', 'sunset') |
| `time.sunrise` | When sun rises             | -    |
| `time.sunset`  | When sun sets              | -    |
| `time.dawn`    | Civil dawn                 | -    |
| `time.dusk`    | Civil dusk                 | -    |
| `time.nauticalDawn` | Nautical dawn        | -    |
| `time.nauticalDusk` | Nautical dusk        | -    |
| `time.nightEnd`     | Night ends           | -    |
| `time.night`        | Night starts         | -    |
| `time.goldenHour`   | Golden hour starts   | -    |
| `time.goldenHourEnd`| Golden hour ends     | -    |

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

// Solar event examples
scenario('Listen for any solar event')
    .when()
        .event('solar').on()
    .then((Scenario, data) => {
        console.log(`Solar event occurred: ${data}`)
    })

scenario('Listen for sunrise specifically')
    .when()
        .event('time.sunrise').on()
    .then(() => {
        console.log('The sun has risen!')
    })
```

---








## Device API

### Methods

The `device` and `capability` components must be included for management.

```javascript
const { scenario, device, capability } = require('fluentiot')
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



#### Finding devices

Devices includes the [Query DSL](#query-dsl-api) mixin to let you find, list and count the created devices. See the Query DSL for a more exhaustive list.

An example of using the Query DSL to find devices based on a specific attribute and its corresponding value.

```javascript
device.add('officeLedMonitor', { id: '111', group: 'office' })
device.add('officeLedDesk', { id: '222', group: 'office' })

const devices = device.find('attributes', { 'group': 'office' })
devices.forEach((dev) => {
    console.log(dev.name)
})

//Find just one device
const dev = device.findOne('attributes', { id: '111' })
console.log(dev.name)

//Count devices
console.log(device.count())
```

### Triggers

Device triggers are an extension of the [Attributes DSL](#attributes-dsl-api) and [Expect DSL](#expect-api).

#### `.device(name: string).attribute(attributeName: string).is(value: any)`

If a devices attribute is updated to true

```javascript
device.add('officeSwitch', { state: false })

scenario('Detect when a switch is turned on')
    .when()
        .device('officeSwitch').attribute('state').is(true)
    .then(() => {
        console.log('Office switch is now on')
    })

//Attribute updated by IoT gateway
device.get('officeSwitch').attribute.update('state', true)
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

### Methods

The `capability` component must be included for management.

When referencing capabilities in devices prefix the capability with an `@` symbol.

```javascript
const { scenario, capability } = require('fluentiot')
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

The `event` component is the central bus for most scenario triggers. It uses the native [NodeJS event emitter](https://nodejs.org/api/events.html) and aliases `emit` and `on`.

### Methods

The `event` component must be included for management.

```javascript
const { scenario, event } = require('fluentiot')
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

### Methods

The `room` component must be included for management.

```javascript
const { scenario, room } = require('fluentiot')
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
const playroom = room.add('playroom', { vacancyDelay: 5 })
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


### Methods for room objects


#### `<room>.addDevice(device: string|object|array)`
Adding a device to a room. You can add a single device or multiple devices by passing an array. Devices can be added by their alias (string) or by passing the device object.

```javascript
const livingPir = device.add('livingPir')
const livingLight = device.add('livingLight')
const living = room.add('living')

// Add a single device by alias
living.addDevice('livingPir')

// Add a single device by object
living.addDevice(livingLight)

// Add multiple devices
living.addDevice(['livingPir', livingLight])
```

#### `<room>.isOccupied()`

Returns `true` if occupied or `false` if vacant.

```javascript
const office = room.add('office')

office.attribute.set('occupied', true)
console.log(office.isOccupied()) //true

office.attribute.set('occupied', false)
console.log(office.isOccupied()) //false
```


#### `<room>.addPresenceSensor(device: Device, expectedKey: string, expectedValue:string)`
Adding an existing sensor to a room for presence detection. This is a preferred method than using the more manual `updatePresence`.

```javascript
const livingPir = device.add('livingPir')
const living = room.add('living')
living.addPresenceSensor(livingPir, 'pir', true)
```

In the above example this will listen to the attribute `pir` for the `livingPir` device. If the attribute is updated to `true` the room presence will be updated. If the value is anything other than `true`, e.g. `false` then the presence is updated and the room `vacancyDelay` will update the occupancy.

In this example setting `vacancyDelay` to `0` will set the room immediately to vacant once the PIR sensor returns a `false` value. In most cases, unless it's a high quality human presence sensor you will want to set the `vacancyDelay` to about `15 minutes`.

```javascript
const livingPir = device.add('livingPir')
const living = room.add('living', { vacancyDelay: 0 })
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




#### `<room>.updatePresence(sensorValue: boolean)`

This method is a manual method for handling presence. It's recommended to use `addPresenceSensor`.

```javascript
// The default vacancyDelay is 15 minutes
room.add('living')

// After 5 minutes of the room not having a positive sensor value the room will become vacant
room.add('office', { vacancyDelay: 5 })

// To ignore the delay set it to 0
room.add('pantry', { vacancyDelay: 0 })
```

Using this API with a scenario and simulating device updates.

```javascript
const { room, device, scenario } = require('fluentiot')

room.add('office', { vacancyDelay: 5 })
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

### Methods

The `scene` component must be included for management.

```javascript
const { scene } = require('fluentiot')
```

#### `scene.add(name: string, callback: object)`

Creating a scene that can be referenced and reused in scenarios.

```javascript
scene.add('cool', () => {
    console.log('Cool scene activated')
})

scenario('Cool scene')
    .when()
        .empty()
    .then(() => {
        scene.get('cool').run()
    })
    .assert()
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

#### `scene.run(name: string, [...args])`

Runs a scene.

```javascript
scene.add('cool', () => {
    console.log('cool')
})
scene.run('cool') //"cool"

//Passing arguments to the scene.
scene.add('hot', (temp) => {
    console.log(`Temp: ${temp}`)
})
scene.run('hot', 30)  //"Temp: 30"
```


---













## Variable API

### Methods

The `variable` component must be included for management.

```javascript
const { variable } = require('fluentiot')
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
scenario('Variable was updated', { suppressFor:0 })
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
scenario('Output the level based on variable value updates', { suppressFor: 0 })
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

The expect `component` is loosely based on [Jest's expect](https://jestjs.io/docs/expect) meaning it should be a fimilar syntax to most developers.

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




---

## Attributes DSL API

Attribute DSL module provides methods for managing attributes associated with an object.

### Methods

| Method           | Description                                                      | Returns   |
|------------------|------------------------------------------------------------------|-----------|
| `get`            | Get the value of a specific attribute.                           | Attribute value or null if not defined. |
| `set`            | Set the value of a specific attribute.                           | `true` if successful. |
| `update`         | Update the value of a specific attribute.                        | None      |



### Examples

```javascript
const { device, event } = require('fluentiot')

const pir = device.add('pir1')

// Set will not trigger an event
pir.attribute.set('name', 'Above TV')

// Update triggers an event that can be used in scenarios
event.on('device.pir1.attribute', (data) => { console.log(`${data.name} updated to ${data.value}`) })
pir.attribute.update('name', 'Entrance')

// Get an attribute
console.log(pir.attribute.get('name'))
```


---











## Query DSL API

Query DSL module provides a set of methods for querying and manipulating data using a DSL (Domain-Specific Language) approach.

It included for scenarios, components, devices, rooms

### Methods

| Method           | Description                                                     | Returns                                           |
|------------------|-----------------------------------------------------------------|---------------------------------------------------|
| `find`           | Find elements in the dataSource that match the query.          | Array of matching elements. Null if no matches.   |
| `findOne`        | Get the first element in the dataSource that matches the query. | The first matching element. Null if no matches.    |
| `get`            | Alias for `findOne` | The first matching element. Null if no matches.    |
| `count`          | Get the total count of elements in the dataSource.              | Total count of elements.                           |
| `list`           | Get the entire dataSource or null if it's empty.               | Entire dataSource or null if empty.               |


### Examples

```javascript
const { device } = require('fluentiot')

device.add('pir1', { id:111, group:'living', name:'Above TV' })
device.add('pir2', { id:222, group:'living', name:'Entrance' })

// There are 2 devices
console.log(`There are ${device.count()} devices`)

// There are 2 living room devices
const livingRoomDeviceCount = device.find('attributes', { group:'living' }).length
console.log(`There are ${livingRoomDeviceCount} living room devices`)

// Entrance device id is 222
const entranceDeviceId = device.findOne('attributes', { name:'Entrance' }).attribute.get('id')
console.log(`Entrance device id is ${entranceDeviceId}`)

// Pir1 name is "Above TV"
const pir1Name = device.get('pir1').attribute.get('name')
console.log(`Pir1 name is "${pir1Name}"`)

// List of all devices
const list = device.list()
Object.keys(list).forEach(key => {
    console.log(`Device ${key} is ${list[key].attribute.get('name')}`)
})
```



---

## Logging API

Logging utility method will replaced with an existing logging package (possibly Winston).

```javascript
const { logger } = require('fluentiot')
logger.info(`Turning on living room lights`)
```

### Anatomy of a log

<span style="background-color:black;"><span style="color:gray;">Dec 19 14:25:36</span> <span style="color:blue;">scenario</span> <span style="color:cyan;">INFO</span> <span style="color:white;">Scenario "Weekends or weekdays" loaded </span></span>

| Type       | Description          | Example                                |
|------------|----------------------|----------------------------------------|
| Timestamp  | Date and time        | Dec 19 14:25:36                        |
| Component  | Category or context   | scenario                               |
| Log Level  | Severity or type      | INFO                                   |
| Log Message| Details of the event  | Scenario "Weekends or weekdays" loaded |



### Logging types

There are multiple types of logging at various levels. All encountered errors will be reported.

While in development set the default logging to `3`. Outside of development it's advised to set the logging to `2` so warnings can still be reported.

| Log Type | Level | Description               |
|----------|-------|---------------------------|
| error    | 0     | Error-level log message   |
| log      | 0     | General log message       |
| info     | 1     | Informational log message |
| warn     | 2     | Warning-level log message |
| debug    | 3     | Debug-level log message   |


### Logging Config
The `fluent.config.js`` file provides a centralized configuration for the Fluent framework, allowing users to customize logging settings and define specific logging levels for individual components.

It is advisable not to directly edit this file; instead, make a copy in your main app directory to implement changes.

The `logging`` object within the configuration file enables users to define logging levels for different components. The levels key specifies the default logging level for any component not explicitly defined. For example:

```javascript
const config = {
    logging: {
        levels: {
            default: 'debug',
            //datetime: 'info',
            //device: 'warn',
            //event: 'debug',
            //expect: 'info',
            //room: 'debug',
            //variable: 'info',
            //scene: 'debug',
            //tuya: 'debug'
        },
    },
    // Other configuration settings...
}
```



### Methods

#### `logger.<type>(message: string[, string component])`

```javascript
logger.info(`Turning on living room lights`, 'app')
logger.error(`Failed to connect to Home Wifi`, 'app')
logger.debug({ "foo": "bar" }, 'app')
```

####  `logger.only(string: regex|string)`
The `only`` method, when applied, refines the logger's output to messages that specifically match the provided string or regex. This feature facilitates the isolation and analysis of logs, focusing on particular types of messages.
```javascript
logger.only('button');
```

####  `logger.ignore(string: regex|string)`
The `ignore`` method in the logger allows for exclusion based on specified criteria, such as strings or regular expressions. This feature proves beneficial for devices that frequently update their attributes, such as temperature or light sensors.
```javascript
logger.ignore('temperature');
```



---

# Tests

Module tests are built with Jest.


To run an individual test
```bash
npm test -- capability.test.js
```



# Todo

- [/] Recode Tuya interface
- [/] Move /src/commons/logger.js to /src/logger.js
- [/] Document utilities
- [/] Replace prettier = removed for now
- [/] Sunset/rise, times of the day shifting based on location
- [/] Improve command interface
- [] Attach devices to rooms
- [] Capability retry when it fails
- [] Ability to put config in ENV for sensitive info
- [] Date component, between renamed to isBetween for consistancy
- [] Backup/restore functionality for device states (State persistence across restarts)


## Bigger ideas
- [] Device discovery
- [] State persistence across restarts
- [] Change to typescript
- [] Include Google Cast component
- [] Voice assistant (check Home Assistant)
- [] API Access / remote access
- [] Rename room to zone/group + support home/s



# Contributing

Bug reports, bug fixes, improvements and new components.

This project is experimental.



# License

Fluent IoT is licensed under [MIT License](./LICENSE).
