function attribute(name) {
    return {
      get: (property1, property2) => {
        // Implement your logic for retrieving nested attributes
        console.log(`Getting attribute ${name}.${property1}.${property2}`);
        // Replace this with your actual attribute retrieval logic
        return `Value of ${name}.${property1}.${property2}`; // Example placeholder
      },
      is: (value) => {
        // Implement your logic for value comparison
        console.log(`Attribute ${name} is ${value}`);
        // Replace this with your actual comparison logic
        return true; // Default return value for chaining
      },
    };
  }
  
  // Example usage
  const myAttribute = attribute('a');
  myAttribute.get('b');
  myAttribute.is('a');
  