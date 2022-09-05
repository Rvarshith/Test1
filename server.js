const http = require("http");
const app = require("./app.js");

const httpServer = http.createServer(app);
const PORT = process.env.PORT = process.env.PORT || process.env.VCAP_APP_PORT || 5000;
const server = httpServer.listen(PORT, () => {
    console.log("Server is up and running on :", PORT);
    
});