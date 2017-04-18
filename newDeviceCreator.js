var util = require('util');
var _ = require('lodash');
const readline = require('readline');
var yaml = require('js-yaml');
var fse = require('fs-extra');
var path = require('path');
var async = require('async');
var msRestAzure = require('ms-rest-azure');
var azureARMClient = require('azure-arm-resource');
var iothub = require('azure-iothub');

var randomIds = {};
var args = process.argv.slice(2);
//var doc = yaml.safeLoad(fse.readFileSync(args[0]+'-schema.yaml', 'utf8'));
var doc = yaml.safeLoad(fse.readFileSync('charmin-schema.yaml', 'utf8'));
var armClient;
var cs;

async.waterfall([
    function(callback) { DeployCloud(callback); },
    function(output, callback) { CreateFirstDevice(output, callback); },
    function(output, callback) { CreateDeviceFirmware(output, callback); },
    function(callback) { CreateMobileApp(); }
    ]
);

function CreateFirstDevice(output, callback) {
    //var connectiostring = cs.iotHubConnectionString.value;
    var connectionString = output.iotHubConnectionString.value;
    var registry = iothub.Registry.fromConnectionString(connectionString);

    // Create a new device
    var device = {
        deviceId: _generateRandomId('FirstDevice-', randomIds)
    };

    registry.create(device, function(err, deviceInfo, res) {
        if (err) console.log('error: ' + err.toString());
        if (res) console.log('status: ' + res.statusCode + ' ' + res.statusMessage);
        if (deviceInfo) console.log('device info: ' + JSON.stringify(deviceInfo));
        var deviceConnectionString = 'HostName='+res.client._host+';DeviceId='+deviceInfo.deviceId+';SharedAccessKey='+deviceInfo.authentication.symmetricKey.primaryKey;
        callback(null, deviceConnectionString);
    });
}

function CreateDeviceFirmware(deviceconnectionstring, callback) {
    var declaration = '';
    var definition = '';
    var defaultModelName;

    declaration += 'BEGIN_NAMESPACE('+doc.namespace.name+');\n';

    _.forEach(doc.namespace.models,function(model, modelname){
        declaration += 'DECLARE_MODEL('+modelname+',\n';
        defaultModelName = modelname;

        _.forEach(model.data, function(data, dataname) {
            declaration += 'WITH_DATA('+data+', '+dataname+'),\n';
        });

        _.forEach(model.actions, function(action, actionname) {
            if (!_.isNil(action) && _.size(action.parameters)>0) {
                declaration += 'WITH_ACTION('+actionname+'';
                _.forEach(action.parameters, function(parameter, parametername) {
                    declaration += ', '+parameter+', '+parametername;
                });
                declaration += '),\n';
                definition += 'EXECUTE_COMMAND_RESULT '+actionname+'('+modelname+'* device';
                _.forEach(action.parameters, function(parameter, parametername) {
                    definition += ', '+parameter+' '+parametername;
                });
                definition += ') {\n';
            } else {
                declaration += 'WITH_ACTION('+actionname+'),\n';
                definition += 'EXECUTE_COMMAND_RESULT '+actionname+'('+modelname+'* device) {\n';
            }

            definition += '    (void)device;\n'
            definition += '    (void)printf("'+actionname+'.\\r\\n");\n';
            definition += '    return EXECUTE_COMMAND_SUCCESS;\n';
            definition += '}\n\n';
        });
        declaration = declaration.substring(0, declaration.length-2)+'\n';
        declaration += ');\n';
    });

    declaration += 'END_NAMESPACE('+doc.namespace.name+');\n\n';

    fse.remove('DeviceFirmware', function(err) {
        if (err) {
            console.error(err);
            callback();
        }

        fse.copy('DeviceTemplate-ESP8266', 'DeviceFirmware', function (err) {
            if (err) {
                console.error(err);
                callback();
            }

            fse.removeSync('DeviceFirmware/src/snippets');
            var top = fse.readFileSync('./DeviceTemplate-ESP8266/src/snippets/top.c').toString()
                .replace(/%%CONNECTIONSTRING%%/g, deviceconnectionstring);

            var bottom = fse.readFileSync('./DeviceTemplate-ESP8266/src/snippets/bottom.c').toString()
                .replace(/%%NAMESPACE%%/g, doc.namespace.name)
                .replace(/%%MODEL%%/g, defaultModelName);

            fse.writeFileSync('DeviceFirmware/src/simplesample_http.c',top+declaration+definition+bottom);
            //console.log(top+declaration+definition+bottom);

            console.log('DeviceFirmwareCreated!');
            callback();
        });
    });

}

function CreateMobileApp(callback) {
    callback();
}

function DeployCloud(callback) {
    // Interactive Login 
    msRestAzure.interactiveLogin(function(err, credentials, subscriptions) {



        var armClient = new azureARMClient.ResourceManagementClient(credentials, '41e79933-b5c4-40a5-9136-2f63c72530d5');//args[1]);
        var groupParameters = { location: doc.location, tags: { "IoTNamespace": doc.namespace.name } };
        armClient.resourceGroups.createOrUpdate(doc.namespace.name, groupParameters, function(rg) {
            var templateFilePath = path.join(__dirname, "IoT.json");
            var template = JSON.parse(fse.readFileSync(templateFilePath, 'utf8'));
            var parameters = {"namespace": { "value": doc.namespace.name }};
            var deploymentParameters = {
                "properties": {
                    "parameters": parameters,
                    "template": template,
                    "mode": "Incremental"
                }
            };
            armClient.deployments.createOrUpdate(
                doc.namespace.name, 
                _generateRandomId(doc.namespace.name+'deployment', randomIds), 
                deploymentParameters, 
                function(error, result) {
                    console.log(result);
                    cs = result.properties.outputs;
                    callback(null, result.properties.outputs);
                }
            );
        });
    });
}

function _generateRandomId(prefix, exsitIds) {
  var newNumber;
  while (true) {
    newNumber = prefix + Math.floor(Math.random() * 10000);
    if (!exsitIds || !(newNumber in exsitIds)) {
      break;
    }
  }
  return newNumber;
}