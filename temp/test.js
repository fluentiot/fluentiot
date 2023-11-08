
const { variable, room, event } = require('../src/fluent-iot.js');

console.log('TEST FILE---------------------')
console.log(event);

class Test {

    hello() {
        console.log('hello test');
        console.log(variable.get('foo'));
        console.log(room.get('office'));
        variable.set('foo','foo');
    }

}

console.log('TEST FILE---------------------')

module.exports = Test;