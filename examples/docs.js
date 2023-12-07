const { scenario, device, event, capability, room, scene, variable  } = require('../index')


scenario('is')
    .when()
        .empty()
    .constraint()
        .device('pir').attribute('sensor').is('active')
        .then(() => { console.log('Is') })
        .assert()