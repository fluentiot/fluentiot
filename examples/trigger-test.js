const { scenario, variable, event } = require('../index')

//Variable changing to a specific value
scenario('Light variable changed to red')
    .when()
    .time.every('1 second')
    .then((scenario) => {
        console.log(scenario.description)
    })

event.emit('time', '10:00')
