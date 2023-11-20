
const { Fluent, scenario, event, variable, device, room, capability } = require('./fluent-iot.js');

//--------------------------------

//const Test = require('./temp/test.js')
// room.add('office', 'Office Room');
// console.log(room.get('office'));

// variable.set('foo','bar');
// console.log(variable.get('foo'));

// const test = new Test();
// test.hello();

// console.log(variable.get('foo'));

//--------------------------------

scenario('Every 2 seconds')
    .when()
        .time().every('2 seconds')
    .then((scenario) => { console.log(scenario.description); })

//--------------------------------

scenario('Light variable changed to red')
    .when()
        .variable('light').is('red')
    .then((scenario) => { console.log(scenario.description); })

scenario('Light variable changed to blue or purple')
    .when()
        .variable('light').is('blue')
        .variable('light').is('purple')
    .then((scenario) => { console.log(scenario.description); })

// variable.set('foo','bar');
// variable.set('light','red');
// variable.set('light','blue');

//--------------------------------

scenario('Variable light changes')
    .when()
        .variable('light').changes()
    .then((scenario, result) => {
        console.log(scenario.description);
        console.log(`Variable light was changed to: ${result}`);
    })

// variable.set('light','green');

//--------------------------------

scenario('Variable light changes')
    .when()
        .variable('light').changes()
    .constraint()
        .variable('light').is('purple')
        .then((scenario, result) => { console.log(`Light is Purple, ${result}`); })
    .constraint()
        .variable('light').is('red')
        .then((scenario, result) => { console.log(`Light is Red, ${result}`); });

// variable.set('light','purple');
// variable.set('light','red');
// variable.set('light','purple');

//--------------------------------

scenario('Variable light changes with else')
    .when()
        .variable('light').changes()
    .constraint()
        .variable('light').is('purple')
        .then((scenario, result) => { console.log(`Light is Purple, ${result}`); })
    .else()
        .then((scenario, result) => { console.log(`Light is ${result}`); });
//variable.set('light','green');

//--------------------------------

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

//variable.set('expiry_test',true,'5 second');

//--------------------------------

scenario('Event was emitted')
    .when()
        .event().on('hello')
    .then((scenario) => { console.log(scenario.description); })
//event.emit('hello');

//--------------------------------

const officeLight = device.add('office-light', 'light');
const officePir = device.add('office-pir', 'pir');

scenario("Light turns on")
        .when()
            .device('office-light').is('on')
        .then(() => {
            console.log('Light is now on!')
        });

scenario("Light turns off")
        .when()
            .device('office-light').isNot('on')
        .then(() => {
            console.log('Light is off!')
        });
//officeLight.updateAttribute('on', true);
//officeLight.updateAttribute('on', false);

//--------------------------------

scenario("Light is pink")
        .when()
            .device('office-light').attribute('color').is('pink')
        .then(() => {
            console.log('Light is pink')
        });
//officeLight.updateAttribute('color', 'pink');

//--------------------------------

officeLight.capability().add('turnOn', () => {
    officeLight.updateAttribute('state', true);
});
officeLight.capability().add('turnOff', () => {
    officeLight.updateAttribute('state', false);
});

scenario("Light turned on with capability")
        .when()
            .device('office-light').attribute('state').is(true)
        .then(() => {
            console.log('Light is on')
        });

// officeLight.turnOn();
// officeLight.turnOff();
// officeLight.turnOn();
// officeLight.turnOn();

//--------------------------------

officeLight.capability().add('foobar', (passed) => {
    console.log('Light foobar called!')
    console.log(passed);
});

scenario("Adding capability")
        .when()
            .empty()
        .then(() => {
            officeLight.foobar('passed!');
        })
        //.assert();

//--------------------------------


const capTurnOff = capability.add('turnOff', () => { console.log('turned off!'); })
const capTurnOn = capability.add('turnOn', () => { console.log('turned on'); })

// device.add('test');
// device.get('test').capability().add(capTurnOff);
// device.get('test').capability().add('@turnOn');
// device.get('test').turnOff();
// device.get('test').turnOn();

// device.add('test2');
// device.get('test2').capability().add(capTurnOff);
// device.get('test2').turnOff();



//--------------------------------

scenario('Certain time of the day')
    .when()
        .time().is('21:22')
    .then((scenario) => { console.log(scenario.description); });

scenario('Every second')
    .when()
        .time().every('second')
    .then((scenario) => { console.log(scenario.description); });

scenario('every minute')
    .when()
        .time().every('minute')
    .then((scenario) => { console.log(scenario.description); });

scenario('every hour')
    .when()
        .time().every('hour')
    .then((scenario) => { console.log(scenario.description); });

//--------------------------------

scenario('Test method single')
    .when()
        .empty()
    .constraint()
        .expect('foo').to.equal('foo')
    .then((scenario) => { console.log(scenario.description); })
    //.assert()
    //.test()

scenario('Test method double')
    .when()
        .empty()
    .constraint()
        .expect('foo').to.equal('foo')
        .expect('bar').to.equal('bar')
        .then((scenario) => { console.log(scenario.description); })
    .assert()
    .test()

scenario('Test method, not match')
    .when()
        .empty()
    .constraint()
        .expect('foo').to.equal('bar')
        .then((scenario) => { console.log(scenario.description); })
    // .assert()
    // .test()

scenario('Test method, not match with an else')
    .when()
        .empty()
    .constraint()
        .expect('foo').to.equal('bar')
        .then((scenario) => { console.log(scenario.description+': If'); })
    .else()
        .then((scenario) => { console.log(scenario.description+': Else'); })
    // .assert()
    // .test()

//--------------------------------


// new Scenario('check every minute and the office light is blue')
//     .when().time().every('minute')
//     .and().device('office-light').is('color', 'blue')
//     .then(() => { console.log('every minute'); });

//--------------------------------

scenario('Every second on a certain day')
    .when()
        .time().every('second')
    .constraint()
        .day().is('saturday')
    .then((scenario) => { console.log(scenario.description); });

//--------------------------------

scenario('Every second on a certain day')
    .when()
        .time().every('second')
    .constraint()
        .day().is('saturday')
        .time().between('22:07', '22:08')
    .then((scenario) => { console.log(scenario.description); });

//--------------------------------

scenario('Weekend')
    .when()
        .time().every('second')
    .constraint()
        .day().is('weekday')
    .then((scenario) => { console.log(scenario.description); });

//--------------------------------

room.add('office');
room.add('living');
room.add('kitchen');

//--------------------------------

scenario('Room is occupied')
    .when()
        .room('office').isOccupied()
    .then((scenario) => {
        console.log(scenario.description);
    });

scenario('Room is vacant')
    .when()
        .room('office').isVacant()
    .then((scenario) => {
        console.log(scenario.description);
    });

//room.get('office').updateOccupied(true);
//room.get('office').updateOccupied(false);

//--------------------------------

scenario('Office room is occupied for time defined')
    .when()
        .room('office').occupied().is('>', '1', 'minute')
    .then((scenario, result) => {
        console.log(scenario.description);
        console.log(result);
    });
//room.get('office').updateOccupied(true);

//--------------------------------

scenario('In test mode, do not run (1)')
    .when()
        .time().every('1 second')
    .then((scenario, result) => {
        console.log(scenario.description);
    });

scenario('In test mode, do not run (2)')
    .when()
        .time().every('1 second')
    .then((scenario, result) => {
        console.log(scenario.description);
    });

scenario('In test mode, DO run (1)')
    .when()
        .time().every('1 second')
    .then((scenario, result) => {
        console.log(scenario.description);
    });

scenario('In test mode, DO run (2)')
    .when()
        .time().every('1 second')
    .then((scenario, result) => {
        console.log(scenario.description);
    });

//--------------------------------

// scenario('Office room is vacant for 1 minute')
//     .when()
//         .room('office').vacantForMinutes('1')
//     .then((scenario) => {
//         console.log(scenario.description);
//     });

// room.get('office').updateOccupied(false);

//--------------------------------

// scenario('Office is occupied for 3 minutes with constraint')
//     .when()
//         .time().every('second')
//     .constraint()
//         .room('office').occupiedForMinutes(1);

// room.get('office').updateOccupied(true);