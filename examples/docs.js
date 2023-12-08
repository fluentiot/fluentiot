const { scenario, device, event, capability, room, scene, variable  } = require('../index')

//Capability for the switch
capability.add('switchOn', (device) => {
    const deviceId = device.attribute.get('id')
    console.log(`Make API call to Tuya to switch device ${deviceId} on`)
})

device.add('office-led-monitor', { id: '111' }, ['@switchOn'])

//Switch this device on
const matchedDevice = device.findOneByAttribute('id', '111')
matchedDevice.switchOn()