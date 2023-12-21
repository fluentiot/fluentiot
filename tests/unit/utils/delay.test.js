const delay = require('./../../../src/utils/delay')

describe('delay', () => {
    it('should delay execution for the specified number of milliseconds', async () => {
        const start = Date.now();
        const delayTime = 1000;
        await delay(delayTime);
        const end = Date.now();
        const elapsedTime = end - start;
        expect(elapsedTime).toBeGreaterThanOrEqual(delayTime);
    });

    it('should resolve immediately when delay time is 0', async () => {
        const start = Date.now();
        const delayTime = 0;
        await delay(delayTime);
        const end = Date.now();
        const elapsedTime = end - start;
        expect(elapsedTime).toBeLessThan(10); // Assuming the delay is negligible
    });

    it('should reject when delay time is negative', async () => {
        const delayTime = -100;
        expect(() => delay(delayTime)).toThrow('Delay time cannot be negative');
    });
});
