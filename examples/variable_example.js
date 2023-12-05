
const { scenario, variable } = require('../index');

//Variable changing to a specific value
scenario('Light variable changed to red')
    .when()
        .variable('light').is('red')
        .time.is('10:00')
    .then((scenario) => { console.log(scenario.description); })
variable.set('light','red');


// //Variable changing to either blue or purple
// //Multiple triggers act as an OR
// scenario('Light variable changed to blue or purple')
//     .when()
//         .variable('light').is('blue')
//         .variable('light').is('purple')
//     .then((scenario) => { console.log(scenario.description); })
// variable.set('light','blue');
// variable.set('light','purple');


// //Variable changed to anything
// scenario('Variable light changes')
//     .when()
//         .variable('light').updated()
//     .then((scenario, result) => {
//         console.log(`Variable light was updated to: ${result}`);
//     })
// variable.set('light','green');