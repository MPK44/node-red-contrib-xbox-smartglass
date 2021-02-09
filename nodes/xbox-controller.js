module.exports = function (RED) {
    let sgClient = require('xbox-smartglass-core-node/src/smartglass')();
    let SystemInputChannel = require('xbox-smartglass-core-node/src/channels/systeminput');

    function connect() {
        return new Promise(function (myResolve, myReject) {
            if (sgClient.isConnected()) {
                myResolve()
            } else {
                sgClient.connect().then(function () {
                    sgClient.addManager('system_input', SystemInputChannel());
                    setTimeout(myResolve, 1000)
                }, function (error) {
                    myReject(error)
                });
            }
        });
    }

    function XboxControllerNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', msg => {
            if (["a", "b", "x", "y", "up", "left", "right", "down", "nexus", "view", "menu"].indexOf(msg.payload) == -1) {
                node.error("Unsupported input: " + msg.payload);
                return
            }
            connect().then(function () {
                sgClient.getManager('system_input').sendCommand(msg.payload).then(function (button) {
                    node.send(msg)
                }, function (error) {
                    node.error(error);
                    console.log(error)
                });
            }, function (error) {
                node.error(error);
                console.log(error)
            });
        });

        this.on('close', done => {
            sgClient.disconnect()
            done()
        });
    }
    RED.nodes.registerType("Xbox-controller", XboxControllerNode);
}
