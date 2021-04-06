# node-red-contrib-xbox-smartglass
This node provides a wide range of controlls for a local Xbox. 
It can turn on/off the Box, simulate controller input and get the current active app.
It is a Node-RED wrapper for the xbox-smartglass-core-node module.

# Configuration
Xbox must be in the same network and needs to accept anonymous connections (Settings-> Connections-> Remote-features-> Xbox app->all devices).
For turning on also energysaving must be disabeled.

# usage
Send one of these commands via `msg.payload`: a/b/x/y/lefr/right/up/down/nexus/view/menu/on/off/getActiveApp
On success the original msg is send to the output. Only exception is getActiveApp which adds the `msg.app` property.
On failure an error is thrown and no msg is output.

## License
[MIT](https://opensource.org/licenses/MIT)