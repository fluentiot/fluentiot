const { scenario, device, event, capability, room, scene, variable  } = require('../index')


scenario('assert and triggers can return args to then()')
    .when()
        .empty()
    .then((_Scenario, colour1, colour2) => {
        console.log(`Colour 1: "${colour1}"`) //red
        console.log(`Colour 2: "${colour2}"`) //green
    })
    .assert('red', 'green')