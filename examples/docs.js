const { scenario, device, event, capability, room, scene, variable, logger  } = require('../index')

function mockDevice() {
    return null;
}

scenario('Foobar')
    .when()
        .empty()
    .then(() => {
        const device = mockDevice()
        device.noSuchMethod()
    })
    .assert()