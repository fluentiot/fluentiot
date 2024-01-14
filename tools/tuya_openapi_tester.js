const TuyaOpenAPI = require('../src/components/tuya/tuya_openapi')
const config = require('../src/config')
const logger = require('../src/utils/logger')

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
// const getDeviceList = async () => {
//     const response = await api.get('/v2.0/cloud/thing/device', { page_size:10 });
//     console.log(`Listing up to 10 devices...`);
//     response.result.forEach(device => {
//         console.log(`Device: ${device.name}`);
//     });
// };
const getDeviceList = async () => {
    let lastId = null;
    let devices = [];
    let query = { page_size: 20 }
    
    do {
        if (lastId) {
            query.last_id = lastId;
        }

        const response = await api.get('/v2.0/cloud/thing/device', query);
        
        console.log(`Listing devices...`);
        
        if (response.result.length > 0) {
            // Add devices to the list
            devices = devices.concat(response.result);

            // Update lastId for the next iteration
            lastId = response.result[response.result.length - 1].id;
        } else {
            // No more data, exit the loop
            console.log('No more devices to fetch.');
            break;
        }
    } while (true);

    // Print out devices
    devices.forEach(device => {
        let onlineText = ''
        if (!device.isOnline) {
            onlineText = ' - OFFLINE';
        }
        console.log(`Device "${device.id}": ${device.name}${onlineText} (${device.productName} / ${device.category})`);
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
};

// Run the main function
main();
