const { scenario, device, event, capability, room, scene, variable, logger  } = require('../index')

capability.add('lightOff', () => {
    console.log('Light off!')
})
device.add('officeLight', {}, ['@lightOff'])
device.get('officeLight').lightOff()

// Example usage
const logMessage = 'The "user" field in the JSON {"name": "John", "joe": { "a":"b" } } is: ' + JSON.stringify({ name: 'Jane' });

logger.log(logMessage)