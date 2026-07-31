const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../logs/server.log");
console.log(logFile);
module.exports = (req, res, next) => {

    const time = new Date().toISOString();

    const log = `${time} | ${req.method} | ${req.originalUrl} | IP: ${req.ip}\n`;

    console.log(log.trim());

    fs.appendFile(logFile, log, (err) => {
        if (err) {
            console.error(err);
        }
    });

    next();

};