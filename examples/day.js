const { scenario } = require('../index')
const { delay } = require('../src/utils')

scenario('Countdown')
    .when()
        .empty()
    .then(async () => {
        console.log('3')
        await delay(1000)
        console.log('2')
        await delay(1000)
        console.log('1')
        await delay(1000)
        console.log('Go!')
    })
    .assert()

