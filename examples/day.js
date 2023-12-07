const { scenario } = require('../index')

scenario('Only on Saturday at 7am')
    .when()
        .time.is('07:00')
    .constraint()
        .day.is('Saturday')
        .then(() => {
            console.log('It is 7am Saturday ')
        })
    .else()
        .then(() => { console.log('It is 7am but not Saturday'); })
    .assert()

scenario('Weekends or weekdays')
    .when()
        .empty()
    .constraint()
        .day.is('weekend')
        .then(() => {
            console.log('It is the weekend')
        })
    .constraint()
        .day.is('weekday')
        .then(() => {
            console.log('It is weekday')
        })
    .assert()

scenario('First week of May')
    .when()
        .empty()
    .constraint()
        .day.between('1st May', '7th May')
        .then((Scenario) => {
            console.log(Scenario.description)
        })
    .assert()

