const { scenario, device, event, capability, room, scene, variable  } = require('../index')


scenario('Runs every minute')
    .when()
        .event('time.minute').on()
    .then(() => {
        console.log('On the minute')
    })