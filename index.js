module.exports = function (options) {

    var path = require('path');
    var fs = require('fs');
    var q = require('q');
    var util = require('util');
    var extend = require('extend');

    extend(options, {
        commandsDir: path.join(__dirname, '../', 'commands')
    });

    var Service = require('nx-service');
    var service = new Service();
    service.map = {};

    service.mapCommands = function () {
        fs.readdir(options.commandsDir, function (error, files) {
            files.forEach(function (cmd) {
                cmd = cmd.substring(0, cmd.indexOf('.js'));
                service.map[ cmd ] = cmd;
                service.emit(service.REGISTER, cmd);
            })
        })
    }

    service.execute = function (command, data) {
        var deferred = q.defer();
        var cmdPath = path.join(options.commandsDir, command + '.js');
        fs.exists(cmdPath, function (exists) {
            if (exists) {
                var cmd = require(cmdPath);
                cmd.execute(data).then(
                    function (result) {
                        service.emit(command + '-success', result);
                        deferred.resolve(result);
                    },
                    function (error) {
                        service.emit(command + '-error', error);
                        deferred.reject(error);
                    }
                )
            }
            else {
                deferred.reject(false);
            }
        });
        return deferred.promise;
    }

    extend(service, {
        REGISTER: 'cmd.register'
    });

    service.start = function () {
        service.mapCommands();
    }

    return service;
}