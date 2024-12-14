const delay = require('./../../../src/utils/delay')

describe('delay function', () => {
    beforeEach(() => {
        jest.useFakeTimers({
            enableGlobally: true,
            legacyFakeTimers: false
        })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should delay execution for the specified number of milliseconds', async () => {
        const callback = jest.fn()
        const promise = delay(1000).then(callback)
        
        expect(callback).not.toHaveBeenCalled()
        jest.advanceTimersByTime(999)
        expect(callback).not.toHaveBeenCalled()
        
        jest.advanceTimersByTime(1)
        await promise
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should resolve immediately when delay time is 0', async () => {
        const callback = jest.fn()
        const promise = delay(0).then(callback)
        
        expect(callback).not.toHaveBeenCalled()
        jest.advanceTimersByTime(0)
        await promise
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should reject when delay time is negative', async () => {
        try {
            await delay(-100)
            // If we get here, fail the test since no error was thrown
            fail('Should have thrown an error')
        } catch (error) {
            expect(error.message).toBe('Delay time cannot be negative')
        }
    })

    it('should handle multiple delays in sequence', async () => {
        const callback = jest.fn()
        const promise = Promise.all([
            delay(100).then(() => callback('first')),
            delay(200).then(() => callback('second')),
            delay(300).then(() => callback('third'))
        ])

        jest.advanceTimersByTime(100)
        jest.advanceTimersByTime(100)
        jest.advanceTimersByTime(100)
        
        await promise
        expect(callback).toHaveBeenCalledTimes(3)
        expect(callback).toHaveBeenNthCalledWith(1, 'first')
        expect(callback).toHaveBeenNthCalledWith(2, 'second')
        expect(callback).toHaveBeenNthCalledWith(3, 'third')
    })

    it('should work with very short delays', async () => {
        const callback = jest.fn()
        const promise = delay(1).then(callback)
        
        expect(callback).not.toHaveBeenCalled()
        jest.advanceTimersByTime(1)
        await promise
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should work with long delays', async () => {
        const callback = jest.fn()
        const promise = delay(24 * 60 * 60 * 1000).then(callback) // 24 hours
        
        expect(callback).not.toHaveBeenCalled()
        jest.advanceTimersByTime(24 * 60 * 60 * 1000)
        await promise
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should handle floating point milliseconds by truncating', async () => {
        const callback = jest.fn()
        const promise = delay(100.75).then(callback)
        
        jest.advanceTimersByTime(100)
        await promise
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should handle concurrent delays', async () => {
        const callback1 = jest.fn()
        const callback2 = jest.fn()
        
        const promise1 = delay(100).then(callback1)
        const promise2 = delay(100).then(callback2)
        
        jest.advanceTimersByTime(100)
        await Promise.all([promise1, promise2])
        
        expect(callback1).toHaveBeenCalledTimes(1)
        expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should handle delay with non-numeric input by coercing to number', async () => {
        const callback = jest.fn()
        const promise = delay('100').then(callback)
        
        jest.advanceTimersByTime(100)
        await promise
        expect(callback).toHaveBeenCalledTimes(1)
    })
})