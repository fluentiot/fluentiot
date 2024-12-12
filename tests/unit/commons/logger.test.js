
// mock config
jest.mock('./../../../src/config', () => {
    return {
        get: jest.fn(() => {})
    }
})
const config = require('./../../../src/config')

const logger = require('./../../../src/logger')

// Mock winston
jest.mock('winston', () => {
    return {
        createLogger: jest.fn(() => {
            return {
                log: jest.fn()
            }
        }),
        format: {
            combine: jest.fn(),
            printf: jest.fn(),
            timestamp: jest.fn(),
        },
        transports: {
            Console: jest.fn(),
        }
    }
})

const _originalTypes = logger.types
const _originalConfig = logger.config


describe('Logger basic methods and setup', () => {
    it('is correctly setup', () => {
        const expected = ['error', 'warn', 'info', 'http', 'verbose', 'debug']
        expect(Object.keys(logger.types)).toEqual(expect.arrayContaining(expected))

        expected.forEach((method) => {
            expect(typeof logger[method]).toBe('function')
        })
    })
    
    it('returns the default log level if component is not found', () => {
        expect(logger._getLogLevel()).toBe(5) //Debug level
        expect(logger._getLogLevel('unknown')).toBe(5) //Debug level
        expect(logger._getLogLevel('debug')).toBe(5) //Debug level
    })

    it('returns the correct log level if defined', () => {
        logger.config.levels = {
            pop: 'error',
            corn: 'verbose',
        }
        expect(logger._getLogLevel('pop')).toBe(0) //Error
        expect(logger._getLogLevel('corn')).toBe(4) //Verbose
    })
})



describe('Parsing messages', () => {

    it('parses a string', () => {
        const result = logger._parseMessage('foobar')
        expect(result).toEqual('foobar')
    })

    it('parses json', () => {
        const result = logger._parseMessage({ foo: 'bar' })
        expect(result).toEqual('{"foo":"bar"}')
    })

    it('parses an error', () => {
        const result = logger._parseMessage(new Error('foobar'))
        expect(result).toContain('foobar')
    })

    it('parses an array with string elements', () => {
        const result = logger._parseMessage(['foo', 'bar'])
        expect(result).toEqual('foo bar')
    })

    it('parses an array with a string and json', () => {
        const result = logger._parseMessage(['foo', { bar: 'baz' }])
        expect(result).toEqual('foo {"bar":"baz"}')
    })

})


describe('Logging messages', () => {
    beforeEach(() => {
        logger.winston.log.mockClear()
    })

    it('logging methods work and will output because default mode is debug', () => {
        logger.config.levels = { default: 'debug' }

        logger.error('message')
        logger.warn('message')
        logger.info('message')
        logger.http('message')
        logger.verbose('message')
        logger.debug('message')

        expect(logger.winston.log).toHaveBeenCalledTimes(6)
    })

    it('will use default if the logging level was not found', () => {
        logger.config.levels = { popcorn: 'not-exist' }
        logger.info('message', 'popcorn')
        expect(logger.winston.log).toHaveBeenCalledTimes(1)
    })

    it('only error should output', () => {
        logger.config.levels = { popcorn: 'error' }

        logger.error('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.http('message', 'popcorn')
        logger.verbose('message', 'popcorn')
        logger.debug('message', 'popcorn')
        
        expect(logger.winston.log).toHaveBeenCalledTimes(1)
    })

    it('only error and warn', () => {
        logger.config.levels = { popcorn: 'warn' }

        logger.error('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.http('message', 'popcorn')
        logger.verbose('message', 'popcorn')
        logger.debug('message', 'popcorn')

        expect(logger.winston.log).toHaveBeenCalledTimes(2)
    })

    it('only error, warn and info', () => {
        logger.config.levels = { popcorn: 'info' }

        logger.error('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.http('message', 'popcorn')
        logger.verbose('message', 'popcorn')
        logger.debug('message', 'popcorn')

        expect(logger.winston.log).toHaveBeenCalledTimes(3)
    })

    it('only error, warn, info, http', () => {
        logger.config.levels = { popcorn: 'http' }

        logger.error('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.http('message', 'popcorn')
        logger.verbose('message', 'popcorn')
        logger.debug('message', 'popcorn')

        expect(logger.winston.log).toHaveBeenCalledTimes(4)
    })

    it('only error, warn, info, http, verbose', () => {
        logger.config.levels = { popcorn: 'verbose' }

        logger.error('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.http('message', 'popcorn')
        logger.verbose('message', 'popcorn')
        logger.debug('message', 'popcorn')

        expect(logger.winston.log).toHaveBeenCalledTimes(5)
    })

    it('only error, warn, info, http, verbose, debug', () => {
        logger.config.levels = { popcorn: 'debug' }

        logger.error('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.http('message', 'popcorn')
        logger.verbose('message', 'popcorn')
        logger.debug('message', 'popcorn')

        expect(logger.winston.log).toHaveBeenCalledTimes(6)
    })

})



describe('Logging only and ignore', () => {

    beforeEach(() => {
        logger.winston.log.mockClear()

        logger._ignored = []
        logger._only = []

        logger.types = _originalTypes
        logger.config.levels = { default: 'debug' }
    })

    it('will ignore log messages', () => {
        logger.ignore('foobar')
        logger.error('before foobar after')
        logger.error('foobar after')
        logger.error('before foobar')
        logger.error('foobar')
        expect(logger.winston.log).toHaveBeenCalledTimes(0)
    })

    it('will ignore some log messages', () => {
        logger.ignore('foobar')
        logger.error('foobar')
        logger.error('foo bar')
        expect(logger.winston.log).toHaveBeenCalledTimes(1)
    })

    it('will only allow certain messages', () => {
        logger.only('foobar')
        logger.error('foobar allow')
        logger.error('foobar')
        logger.error('foo bar reject')
        logger.error('reject')
        expect(logger.winston.log).toHaveBeenCalledTimes(2)
    })

})