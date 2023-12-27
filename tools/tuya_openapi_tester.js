const TuyaOpenAPI = require('../src/components/tuya/tuya_openapi');
const config = require('../src/config');

// Setup Tuya based on your config
const tuyaConfig = config.get('tuya')
const api = new TuyaOpenAPI(
    config.get('tuya.base_url'), 
    tuyaConfig.access_key, 
    tuyaConfig.secret_key,
    tuyaConfig.username,
    tuyaConfig.password
);

// Connect to Tuya API
const connect = async () => {
    try {
        await api.connect();
        console.log('Connected to Tuya API');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to get the list of devices
const getDeviceList = async () => {
    const response = await api.get('/v2.0/cloud/thing/device', { page_size:10 });
    console.log(`Listing up to 10 devices...`);
    response.result.forEach(device => {
        console.log(`Device: ${device.name}`);
    });
};

// Function to refresh the token
const refreshToken = async () => {
    try {
        await api.__refresh_access_token();
        console.log('Token refreshed successfully');
    } catch (error) {
        console.error('Error:', error);
    }
};

// Perform the operations
const main = async () => {
    // Connect
    await connect();

    // Get the list of devices
    await getDeviceList();

    // Refresh the token
    await refreshToken();

    // Get the list of devices again
    await getDeviceList();
};

// Run the main function
main();
