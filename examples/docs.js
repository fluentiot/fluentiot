const { scenario, device, event, capability, room, scene, variable, logger  } = require('../index')

capability.add('lightOff', () => {
    console.log('Light off!')
})
device.add('officeLight', {}, ['@lightOff'])
device.get('officeLight').lightOff()