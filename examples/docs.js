const { scenario, device, event, capability, room, scene, variable  } = require('../index')

//Capability for the switch
capability.add('switchOn', (device) => {
    const deviceId = device.attribute.get('id')
    console.log(`Make API call to Tuya to switch device ${deviceId} on`)
})

scenario('Runs every minute')
    .when()
        .event('time.minute').on()
    .then(() => {
        console.log('On the minute')
    })
