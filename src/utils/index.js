
module.exports = {
    isValidName: require('./validation').isValidName,
    delay: require('./delay'),
    dot: require('./dot'),
    expect: require('./expect'),
    isJSONString: require('./is_json'),
    addDurationToNow: require('./datetime').addDurationToNow,
    getDurationInMilliseconds: require('./datetime').getDurationInMilliseconds,
}
