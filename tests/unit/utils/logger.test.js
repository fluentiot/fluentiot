const logger = require('./../../../src/utils/logger')

beforeEach(() => {})

describe('Logger basic methods and setup', () => {
    it('is correctly setup', () => {
        const expected = ['log', 'info', 'warn', 'error', 'debug']
        expect(Object.keys(logger.types)).toEqual(expect.arrayContaining(expected))

        expected.forEach((method) => {
            expect(typeof logger[method]).toBe('function')
        })
    })

    it('timestamp method returns a string in "Dec 17 10:38:14" or "HH:mm:ss" format', () => {
        // Check if the timestamp follows the "Dec 17 10:38:14" format or "HH:mm:ss" format
        const timestamp = logger._getCurrentTimestamp();
        
        const isDecDateFormat = /^\w{3} \d{1,2} \d{2}:\d{2}:\d{2}$/.test(timestamp);
        const isHHMMSSFormat = /^\d{2}:\d{2}:\d{2}$/.test(timestamp);
    
        expect(isDecDateFormat || isHHMMSSFormat).toBe(true);
    
        if (isDecDateFormat) {
            // If it's in "Dec 17 10:38:14" format, additional checks can be added
            const [month, day, time] = timestamp.split(' ');
            const [hours, minutes, seconds] = time.split(':');
    
            expect(month).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/);
            expect(Number(day)).toBeGreaterThanOrEqual(1);
            expect(Number(day)).toBeLessThanOrEqual(31);
            expect(Number(hours)).toBeGreaterThanOrEqual(0);
            expect(Number(hours)).toBeLessThan(24);
            expect(Number(minutes)).toBeGreaterThanOrEqual(0);
            expect(Number(minutes)).toBeLessThan(60);
            expect(Number(seconds)).toBeGreaterThanOrEqual(0);
            expect(Number(seconds)).toBeLessThan(60);
        }
    });
    

    it('returns the default log level if component is not found', () => {
        expect(logger._getLogLevel()).toBe(3) //Debug level
        expect(logger._getLogLevel('unknown')).toBe(3) //Debug level
        expect(logger._getLogLevel('debug')).toBe(3) //Debug level
    })

    it('returns the correct log level if defined', () => {
        logger.config.levels = {
            pop: 'error',
            corn: 'info',
        }
        expect(logger._getLogLevel('pop')).toBe(0) //Error
        expect(logger._getLogLevel('corn')).toBe(1) //Info
    })
})

describe('Logging messages', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {})
        jest.spyOn(logger, 'debug')
        console.log.mockClear()
    })

    it('logging methods work and will output because default mode is debug', () => {
        logger.config.levels = { default: 'debug' }
        logger.log('message')
        logger.info('message')
        logger.warn('message')
        logger.error('message')
        logger.debug('message')
        expect(console.log).toHaveBeenCalledTimes(5)
    })

    it('will use default if the logging level was not found and an additional error is outputted', () => {
        logger.config.levels = { popcorn: 'not-exist' }
        logger.log('message', 'popcorn')
        expect(console.log).toHaveBeenCalledTimes(2)
    })

    it('only log and error should output', () => {
        logger.config.levels = { popcorn: 'log' }
        logger.log('message', 'popcorn')
        logger.error('message', 'popcorn')

        logger.info('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.debug('message', 'popcorn')
        expect(console.log).toHaveBeenCalledTimes(2)
    })

    it('only log, info, error should output', () => {
        logger.config.levels = { popcorn: 'info' }
        logger.log('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.error('message', 'popcorn')

        logger.warn('message', 'popcorn')
        logger.debug('message', 'popcorn')
        expect(console.log).toHaveBeenCalledTimes(3)
    })

    it('only log, info, warn, error should output', () => {
        logger.config.levels = { popcorn: 'warn' }
        logger.log('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.error('message', 'popcorn')

        logger.debug('message', 'popcorn')
        expect(console.log).toHaveBeenCalledTimes(4)
    })

    it('all should output', () => {
        logger.config.levels = { popcorn: 'debug' }
        logger.log('message', 'popcorn')
        logger.info('message', 'popcorn')
        logger.warn('message', 'popcorn')
        logger.error('message', 'popcorn')
        logger.debug('message', 'popcorn')
        expect(console.log).toHaveBeenCalledTimes(5)
    })

})
