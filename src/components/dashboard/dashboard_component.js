const Component = require('./../component')
const logger = require('./../../logger')
const config = require('./../../config')
const express = require('express')
const http = require('http')
const session = require('express-session')
const cookieParser = require('cookie-parser')
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
        this.app = express()
        this.server = null
        
        // Check if component is enabled
        if (!this.config.enabled) {
            logger.info('Dashboard component is disabled', 'dashboard')
            return
        }
        
        this.setupMiddleware()
        this.setupRoutes()
        
        logger.info('Dashboard component initialized', 'dashboard')
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        this.app.use(cookieParser());
        this.app.use(session({
            secret: 'fluentiot-dashboard-secret',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false } // Set to true if using HTTPS
        }));
        this.app.use(express.json());
    }

    /**
     * Setup Express routes
     */
    setupRoutes() {
        // API routes
        this.app.get('/api/settings', (req, res) => {
            res.json(req.session.settings || { theme: 'dark', showDebugMessages: true });
        });

        this.app.post('/api/settings', (req, res) => {
            req.session.settings = req.body;
            res.json({ success: true });
        });

        // Static file routes
        this.app.get('/', (req, res) => {
            this.serveTemplate('index.html', res)
        });
        this.app.use(express.static(path.join(__dirname, 'templates')));
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
            // Create HTTP server from Express app
            this.server = http.createServer(this.app)

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
     * Serve template files
     */
    serveTemplate(templateName, res, contentType = 'text/html') {
        const templatePath = path.join(__dirname, 'templates', templateName)
        
        fs.readFile(templatePath, 'utf8', (err, data) => {
            if (err) {
                logger.error(`Failed to read template ${templateName}: ${err.message}`, 'dashboard')
                res.status(500).send('Internal Server Error')
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
            
            res.header('Content-Type', contentType).send(renderedData)
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
