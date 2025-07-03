const logger = require('../src/logger');
const LoggingMixin = require('../src/components/_mixins/logging_mixin');

// Test entity logging system
console.log('Testing Entity Logging System...\n');

// Mock entity objects
const mockDevice = {
    name: 'testLight',
    id: 'device_testLight_001'
};

const mockRoom = {
    name: 'testRoom',
    id: 'room_testRoom_001'
};

// Test direct entity logging
console.log('1. Testing direct entity logging:');
logger.info('Device turned on', 'device', mockDevice, { power: 100 });
logger.warn('Room occupancy timeout', 'room', mockRoom, { timeout: 15 });
logger.error('Device connection failed', 'device', mockDevice, { error: 'network_timeout' });

// Test logging mixin
console.log('\n2. Testing logging mixin:');
Object.assign(mockDevice, LoggingMixin(mockDevice, 'device'));
Object.assign(mockRoom, LoggingMixin(mockRoom, 'room'));

mockDevice.log.info('Device state changed', { state: 'on' });
mockDevice.log.debug('Capability executed', { capability: 'turnOn' });
mockRoom.log.info('Motion detected');
mockRoom.log.warn('No motion for 10 minutes');

// Test log retrieval
console.log('\n3. Testing log retrieval:');
console.log('Device logs:', JSON.stringify(mockDevice.log.recent(3), null, 2));
console.log('Room stats:', JSON.stringify(mockRoom.log.stats, null, 2));

// Test filtering
console.log('\n4. Testing log filtering:');
console.log('Device error logs:', JSON.stringify(mockDevice.log.byLevel('error'), null, 2));
console.log('Room info logs:', JSON.stringify(mockRoom.log.byLevel('info'), null, 2));

// Test summary for dashboard
console.log('\n5. Testing dashboard summary:');
console.log('Device summary:', JSON.stringify(mockDevice.log.summary(2), null, 2));

console.log('\n✅ Entity Logging System test completed!');
