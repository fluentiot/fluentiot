const LLMComponent = require('../../src/components/llm/llm_component');
const OpenAIProvider = require('../../src/components/llm/providers/openai_provider');

// Mock the provider to avoid actual API calls
jest.mock('../../src/components/llm/providers/openai_provider');

describe('LLMComponent', () => {
    let llmComponent;
    let fluent;

    beforeEach(() => {
        // Clear all instances and calls to constructor and methods before each test
        OpenAIProvider.mockClear();

        fluent = {
            _command: () => ({
                getAllCommands: () => ({
                    'test.command': {
                        description: 'A test command',
                        parameters: [{ name: 'param1', type: 'string', required: true }]
                    }
                })
            }),
            getComponent: jest.fn((componentName) => {
                if (componentName === 'device') {
                    return {
                        devices: {
                            'testDevice': {
                                name: 'Test Device',
                                attributes: { power: 'off' },
                                capabilities: ['turnOn', 'turnOff']
                            }
                        }
                    };
                }
                return null;
            })
        };

        // Mock config
        const config = require('../../../src/config');
        config.get = jest.fn().mockReturnValue({
            enabled: true,
            provider: 'openai',
            openai: {
                apiKey: 'test-key'
            }
        });

        llmComponent = new LLMComponent(fluent);
        llmComponent.afterLoad();
    });

    it('should accumulate history and pass it to the provider', async () => {
        const providerInstance = OpenAIProvider.mock.instances[0];
        const processNaturalLanguageMock = providerInstance.processNaturalLanguage;

        // Mock the provider's response
        processNaturalLanguageMock.mockResolvedValue({
            success: true,
            commands: [{ command: 'test.command', parameters: { param1: 'value1' } }],
            explanation: 'Turning on the test device'
        });
        
        // First prompt
        await llmComponent.processNaturalLanguage('turn on the test device');

        // Check that history was passed to the provider
        expect(processNaturalLanguageMock).toHaveBeenCalledWith(
            'turn on the test device',
            expect.any(Object),
            [{ role: 'user', content: 'turn on the test device' }]
        );

        // Second prompt
        await llmComponent.processNaturalLanguage('now turn it off');

        // Check that history now contains both prompts and the previous response
        expect(processNaturalLanguageMock).toHaveBeenCalledWith(
            'now turn it off',
            expect.any(Object),
            [
                { role: 'user', content: 'turn on the test device' },
                { role: 'assistant', content: JSON.stringify([{ command: 'test.command', parameters: { param1: 'value1' } }]) },
                { role: 'user', content: 'now turn it off' }
            ]
        );
    });
});
