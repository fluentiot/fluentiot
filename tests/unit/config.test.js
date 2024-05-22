const fs = require('fs');
jest.mock('fs');

jest.spyOn(console, 'warn').mockImplementation(() => {})

const { Config } = require('./../../src/config');

jest.mock('./../../src/commons/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}))
const logger = require('./../../src/commons/logger');

let originalCwd;

beforeAll(() => {
    originalCwd = process.cwd;
    process.cwd = jest.fn(() => '/path/to/project');

});

afterAll(() => {
    process.cwd = originalCwd;
});


describe('load', () => {

    it('loads config from project root if exists', () => {
        const mockConfig = { key: 'value' };
        fs.existsSync.mockReturnValueOnce(true);
        jest.spyOn(Config.prototype, 'getConfigFilePath').mockReturnValueOnce('/path/to/project/fluent.config.js');
        jest.spyOn(Config.prototype, 'loadConfigFile').mockReturnValueOnce(mockConfig);

        const config = new Config();
        expect(config.config).toEqual(mockConfig);
    });

    it('loads default config if project root config does not exist', () => {
        const mockConfig = { key: 'value' };
        fs.existsSync.mockReturnValueOnce(false);
        jest.spyOn(Config.prototype, 'getConfigFilePath').mockReturnValueOnce('/path/to/Config/fluent.config.js');
        jest.spyOn(Config.prototype, 'loadConfigFile').mockReturnValueOnce(mockConfig);

        const config = new Config();
        expect(config.config).toEqual(mockConfig);
    });

    it('throws an error if there is an issue loading the config file', () => {
        fs.existsSync.mockReturnValueOnce(true);
        jest.spyOn(Config.prototype, 'getConfigFilePath').mockReturnValueOnce('/path/to/project/fluent.config.js');
        jest.spyOn(Config.prototype, 'loadConfigFile').mockImplementation(() => {
            throw new Error('Mocked error loading config file');
        });

        expect(() => new Config()).toThrowError('Error loading config: Mocked error loading config file');
    });
});



describe('get', () => {

    beforeEach(() => {
        fs.existsSync.mockReturnValueOnce(true);
        jest.spyOn(Config.prototype, 'loadConfigFile').mockReturnValueOnce({});
    });

    it('returns first level property from config', () => {
        const mockConfig = {
            database: {
                host: 'localhost',
                port: 27017,
            }
        };
        const config = new Config();
        config.config = mockConfig;

        expect(config.get('database')).toEqual({ host:'localhost', port:27017 });
    });

    it('returns nested property from config', () => {
        const mockConfig = {
            database: {
                host: 'localhost',
                port: 27017,
            },
        };
        const config = new Config();
        config.config = mockConfig;

        expect(config.get('database.host')).toEqual('localhost');
        expect(config.get('database.port')).toEqual(27017);
    });

    it('returns null and logs error if config is not loaded', () => {
        const spyError = jest.spyOn(logger, 'error');
        const config = new Config();
        config.config = null;

        expect(config.get('some.key')).toBeNull();
        expect(spyError).toHaveBeenCalledWith('Config not loaded', 'core');
    });

    it('returns null and logs warning if key is not found', () => {
        const spyWarn = jest.spyOn(logger, 'warn');
        const config = new Config();
        config.config = { key: 'value' };

        expect(config.get('nonexistent.key')).toBeNull();
        expect(spyWarn).toHaveBeenCalledWith('Config key "nonexistent.key" not found', 'core');
    });
    
});