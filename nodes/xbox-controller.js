module.exports = function (RED) {
  let Sunglass = require('xbox-smartglass-core-node/src/smartglass');
  let SystemInputChannel = require('xbox-smartglass-core-node/src/channels/systeminput');
  
	RED.httpAdmin.get('/node-red-contrib-xbox-smartglass/liveID', function(req, res, next) {
		let ip = req.query.ip;
		let liveId = "";
		let sgClient = Sunglass()
    sgClient.connect(ip).then(function () {
        liveId = sgClient._console.getLiveid();
        sgClient.disconnect();
        res.end(JSON.stringify(liveId));
    }, function (error) {
        res.end(JSON.stringify(""));
    });
	});
	
	RED.httpAdmin.get('/node-red-contrib-xbox-smartglass/discover', function(req, res, next) {
		let boxes = [];
		let sgClient = Sunglass()
    sgClient.discovery().then(function (data) {
        data.forEach(box => {
          boxes.push(box.remote.address)
        })
        res.end(JSON.stringify(boxes));
    }, function (error) {
        res.end(JSON.stringify([]));
    });
	});
	
  function XboxControllerNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let sgClient = Sunglass();
    let ip = (config.iptype == "fix" ? config.ip : null);

    function connect() {
      return new Promise(function (myResolve, myReject) {
        if (sgClient.isConnected()) {
          myResolve();
        } else {
          sgClient.connect(ip).then(function () {
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
            node.error(error, msg);
            node.status({})
          });
        }, function (error) {
          node.error(error, msg);
          node.status({})
        });
      } else if (msg.payload == 'on') {
        if (ip == null) {
          node.error("Can't use Broadcast for turning on", msg);
          node.status({})
          return
        }
        sgClient.powerOn({
          'ip': ip,
          'live_id': config.liveID,
          'tries': 10
        }).then(function () {
          node.send(msg);
          node.status({})
        }, function (error) {
          node.error(error.error, msg);
          node.status({})
        });
      } else if (msg.payload == 'off') {
        connect().then(function () {
          sgClient.powerOff().then(function () {
            node.send(msg);
            node.status({})
          }, function (error) {
            node.error(error, msg);
            node.status({})
          });
        }, function (error) {
          node.error(error, msg);
          node.status({})
        });
      } else if (msg.payload == "getActiveApp" || msg.payload == "getBoxInfo") {
        connect().then(function () {
          msg.app = sgClient.getActiveApp();
          msg.liveID = sgClient._console.getLiveid();
          msg.ip = sgClient._console.getIp();
          node.send(msg);
          node.status({})
        }, function (error) {
          node.error(error, msg);
          node.status({})
        });
      } else {
        node.error("Unsupported input: " + msg.payload, msg);
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
