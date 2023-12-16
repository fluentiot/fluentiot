const { scenario, device, event, capability, room, scene, variable  } = require('../index')

//Capability for the switch
capability.add('switchOn', (device) => {
    const deviceId = device.attribute.get('id')
    console.log(`Make API call to Tuya to switch device ${deviceId} on`)
})

capability.add('lightOff', () => {
    console.log('Light off!')
})
device.add('officeLight', {}, ['@lightOff'])
device.get('officeLight').lightOff()