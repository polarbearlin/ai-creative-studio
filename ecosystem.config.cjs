module.exports = {
    apps: [{
        name: "ai-creative-studio",
        script: "./server.js",
        env: {
            NODE_ENV: "production",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
}
