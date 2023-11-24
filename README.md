# Fluent IoT

Fluent IoT provides a fluent and intuitive DSL (domain-specific language) programming interface for creating human-readable scenarios, interacting with IoT devices and handling various IoT-related tasks. It is tailored for developers who want to create customized IoT solutions.



**Important Note:** Fluent IoT is not a graphical user interface (GUI) platform like Home Assistant or similar solutions. It is a framework meant to be integrated into your code, providing you with the flexibility to connect and control your own IoT devices programmatically. You must already have the ability to both see the state of your IoT devices and interact with them for Fluent to be of any use.


## Key Features

- **Scenario Management:** Easily create and manage IoT scenarios with a human-readable fluent syntax.
- **Event-Driven Architecture:** Fluent IoT simplifies communication with a central event bus, a unified event-driven approach
- **Device Abstraction:** Define and manage different types of IoT devices with customizable capabilities.
- **Room Management:** Basic room management to understand if a room is occupied or vacant triggering scenarios.
- **Variable Handling:** Manage and manipulate variables within your IoT scenarios.
- **Extensibility:** Extend the framework with your own devices, scenarios, and components.


## Connecting IoT Devices

Fluent IoT is designed to work with your own IoT devices. Users are required to connect their devices to the code using the provided interfaces.



## Getting Started

Follow these steps to get started with Fluent IoT:

1. Clone the repository: `git clone https://github.com/darrenmoore/fluent-iot.git`
2. Install dependencies: `npm install`
3. Explore the examples and documentation to understand the syntax and usage.



## Examples

Here's a simple example of creating a scenario:

```javascript
const { Fluent, scenario, event, variable, device, room } = require('fluent-iot');

const officeLight = device.add('office-light', 'light');

scenario('When the office light turns on')
    .when()
        .device('office-light').is('on')
    .then(() => {
        console.log('Light is on!')
    });

officeLight.when().turnOn().then(() => {
    //Custom code to turn your IoT device on
});

scenario('At 6:00pm turn on the office light')
    .when()
        .time().is('18:00')
    .then((scenario) => {
        officeLight.turnOn();
    });



// Expiring variables with multiple constraints
scenario('Variable expires')
    .when()
        .time().every('1 second')
    .constraint()
        .variable('expiry_test').is(true)
        .then(() => {
            console.log('Expiry is TRUE');
        })
    .constraint()
        .variable('expiry_test').is(null)
        .then(() => {
            console.log('Expiry has reset');
        })
    .else()
        .then(() => {
            console.log('Expiry is something else');
        });
variable.set('expiry_test',true,'5 second');