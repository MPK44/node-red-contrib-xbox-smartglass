module.exports = function (RED) {
  let Sunglass = require('xbox-smartglass-core-node/src/smartglass');
  let SystemInputChannel = require('xbox-smartglass-core-node/src/channels/systeminput');

  function XboxControllerNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    let sgClient = Sunglass();
    var ip = (node.iptype == "fix" ? node.ip : null);

    function connect() {
      return new Promise(function (myResolve, myReject) {
        if (sgClient.isConnected()) {
          myResolve();
        } else {
          sgClient.connect(null).then(function () {
            sgClient.addManager('system_input', SystemInputChannel());
            setTimeout(myResolve, 1000);
          }, function (error) {
            myReject(error.message);
          });
        }
      });
    }

    node.on('input', msg => {
      node.status({
        fill: "blue",
        shape: "dot",
        text: "working"
      });
      if (["a", "b", "x", "y", "up", "left", "right", "down", "nexus", "view", "menu"].indexOf(msg.payload) != -1) {
        connect().then(function () {
          sgClient.getManager('system_input').sendCommand(msg.payload).then(function (button) {
            node.send(msg);
            node.status({})
          }, function (error) {
            node.error(error);
            node.status({})
          });
        }, function (error) {
          node.error(error);
          node.status({})
        });
      } else if (msg.payload == 'on') {
        if (ip == null) {

          node.error("Can't use Broadcast for turning on");
          node.status({})
          return
        }
        var options = {
          'ip': ip,
          'live_id': node.liveID
        };
        sgClient.powerOn(options).then(function () {
          node.send(msg);
          node.status({})
        }, function (error) {
          node.error(error.error);
          node.status({})
        });
      } else if (msg.payload == 'off') {
        connect().then(function () {
          sgClient.powerOff().then(function () {
            node.send(msg);
            node.status({})
          }, function (error) {
            node.error(error);
            node.status({})
          });
        }, function (error) {
          node.error(error);
          node.status({})
        });
      } else if (msg.payload == "getActiveApp") {
        connect().then(function () {
          msg.app = sgClient.getActiveApp();
          node.send(msg);
          node.status({})
        }, function (error) {
          node.error(error);
          node.status({})
        });
      } else {
        node.error("Unsupported input: " + msg.payload);
        node.status({})
      };
    });

    this.on('close', done => {
      sgClient.disconnect()
      done()
    });
  }
  RED.nodes.registerType("Xbox-controller", XboxControllerNode);
}