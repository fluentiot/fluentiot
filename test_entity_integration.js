const Device = require('./src/components/device/device');
const Room = require('./src/components/room/room');
const Scene = require('./src/components/scene/scene');
const Scenario = require('./src/scenario');
const logger = require('./src/logger');

// Mock parent objects
const mockParent = {
    emit: () => {},
    getComponent: () => ({ get: () => () => {} }),
    Fluent: {
        getComponent: () => ({ get: () => ({}) }),
        updateTestMode: () => {},
        component: { list: () => ({}) }
    }
};

console.log('Testing Entity Logging System Integration...\n');

// Test Device
console.log('1. Testing Device:');
const device = new Device(mockParent, 'testLight', { switch: false }, []);
device.log.info('Light turned on', { brightness: 100 });
device.log.warn('High power consumption detected');
device.attribute.update('switch', true); // This should auto-log
console.log('Device description:', JSON.stringify(device.describe(), null, 2));

// Test Room
console.log('\n2. Testing Room:');
const room = new Room(mockParent, 'livingRoom', { occupied: false });
room.log.info('Motion detected');
room.updatePresence(true); // This should auto-log
console.log('Room description:', JSON.stringify(room.describe(), null, 2));

// Test Scene
console.log('\n3. Testing Scene:');
const scene = new Scene(mockParent, 'movieNight', () => console.log('Scene executed'));
scene.log.info('Scene configured');
scene.run(); // This should auto-log
console.log('Scene description:', JSON.stringify(scene.describe(), null, 2));

// Test Scenario
console.log('\n4. Testing Scenario:');
const scenario = new Scenario(mockParent.Fluent, 'Test Motion Scenario');
scenario.log.info('Scenario setup complete');
scenario.log.warn('Constraint check failed');
console.log('Scenario description:', JSON.stringify(scenario.describe(), null, 2));

// Test Logger Direct Access
console.log('\n5. Testing Logger Direct Access:');
console.log('All logged entity types:', logger.getLoggedEntityTypes());
console.log('Device entities with logs:', logger.getLoggedEntities('device'));
console.log('Room entities with logs:', logger.getLoggedEntities('room'));

console.log('\n✅ Entity Logging System integration test completed!');
