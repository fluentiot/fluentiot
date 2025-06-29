const Component = require('./../component')
const logger = require('./../../logger')
const config = require('./../../config')
const http = require('http')
const path = require('path')
const fs = require('fs')

/**
 * Dashboard component for web-based monitoring interface
 *
 * @extends Component
 * @class
 */
class DashboardComponent extends Component {

    /**
     * Constructor
     * 
     * @param {Fluent} Fluent - The Fluent IoT framework.
     */
    constructor(Fluent) {
        super(Fluent)
        
        this.config = config.get('dashboard') || {}
        this.server = null
        this.socketioComponent = null
        
        // Check if component is enabled
        if (!this.config.enabled) {
            logger.info('Dashboard component is disabled', 'dashboard')
            return
        }
        
        logger.info('Dashboard component initialized', 'dashboard')
    }

    /**
     * Called after the component is loaded
     */
    afterLoad() {
        if (this.config.enabled) {
            this.start()
        }
    }

    /**
     * Start the dashboard web server
     */
    start() {
        if (!this.config.enabled) {
            return
        }

        try {
            // Get SocketIO component reference
            this.socketioComponent = this.getComponent('socketio')
            
            // Create HTTP server
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res)
            })

            // Start listening
            const port = this.config.port || 9003
            const host = this.config.host || 'localhost'
            
            this.server.listen(port, host, () => {
                logger.info(`Dashboard server listening on ${host}:${port}`, 'dashboard')
            })

        } catch (error) {
            logger.error(`Failed to start Dashboard server: ${error.message}`, 'dashboard')
        }
    }

    /**
     * Handle HTTP requests
     */
    handleRequest(req, res) {
        const url = req.url === '/' ? '/index.html' : req.url
        
        if (url === '/index.html') {
            this.serveTemplate('index.html', res)
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('Not Found')
        }
    }

    /**
     * Serve template files
     */
    serveTemplate(templateName, res) {
        const templatePath = path.join(__dirname, 'templates', templateName)
        
        fs.readFile(templatePath, 'utf8', (err, data) => {
            if (err) {
                logger.error(`Failed to read template ${templateName}: ${err.message}`, 'dashboard')
                res.writeHead(500, { 'Content-Type': 'text/plain' })
                res.end('Internal Server Error')
                return
            }

            // Replace template variables
            const socketioConfig = config.get('socketio') || {}
            
            // For client connections, we need to convert 0.0.0.0 to the actual IP
            let host = socketioConfig.host || 'localhost'
            if (host === '0.0.0.0') {
                // Try to get the dashboard host, or default to 192.168.1.123 based on your config
                host = this.config.host || '192.168.1.123'
                if (host === '0.0.0.0') {
                    host = '192.168.1.123' // Fallback to your Pi's IP
                }
            }
            
            const socketioUrl = `http://${host}:${socketioConfig.port || 9002}`
            const authToken = socketioConfig.auth ? socketioConfig.auth.token : ''
            
            let renderedData = data.replace('{{SOCKETIO_URL}}', socketioUrl)
            renderedData = renderedData.replace('{{AUTH_TOKEN}}', authToken)
            
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(renderedData)
        })
    }

    /**
     * Stop the dashboard server
     */
    stop() {
        if (this.server) {
            this.server.close()
            logger.info('Dashboard server stopped', 'dashboard')
        }
    }

    /**
     * Teardown the component
     */
    teardown() {
        this.stop()
        super.teardown()
    }
}

module.exports = DashboardComponent
