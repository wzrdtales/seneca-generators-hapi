"use strict";

// Instana Sensor needed to have node functionality in instana
if (process.env.NODE_ENV === "production") {
  require("instana-nodejs-sensor")();
}

const bunyan = require("bunyan");
const logger = bunyan.createLogger({
  name: "api-gateway"
});
const Hapi = require("hapi");
const config = require("./config.js");
const assert = require("assert");
const Chairo = require("chairo");
const dns = require("dns");
const os = require("os");

const server = new Hapi.Server();

const boot = new Date();

server.connection(config.server);

function dnsSeed(seneca, options, bases, next) {
  dns.lookup(
    config.baseName,
    {
      all: 4
    },
    (err, addresses) => {
      let bases = [];

      if (err) {
        throw new Error("dns lookup for base node failed");
      }

      if (Array.isArray(addresses)) {
        bases = addresses.map(address => {
          return address.address;
        });
      } else {
        bases.push(addresses);
      }

      next(bases);
    }
  );
}

function next() {
  if (module.parent) {
    return;
  }

  server.start(function() {
    const bootTime = new Date() - boot;
    logger.info(`Server running at: ${server.info.uri}, booted in ${bootTime}`);
  });
}

function healthCheck(server, callback) {
  callback();
}

function register(cb) {
  if (process.env.NODE_ENV !== "test") {
    server.register(
      [
        {
          register: require("hapi-auth-cookie")
        },
        {
          register: Chairo
        },
        {
          register: require("hapi-graceful-shutdown-plugin"),
          options: {
            sigtermTimeout: 10,
            sigintTimeout: 1
          }
        },
        {
          register: require("hapi-alive"),
          options: {
            path: "/health",
            tags: ["health", "monitor"],
            healthCheck: healthCheck
          }
        }
      ],
      function(err) {
        assert.ifError(err);
        let _config;

        _config = {
          auto: true,
          discover: {
            rediscover: true,
            custom: {
              active: true,
              find: dnsSeed
            }
          }
        };

        if (process.env.rancher) {
          _config.host = os.networkInterfaces().eth0[0].address;
        }

        server.auth.strategy("session", "cookie", config.cookies);
        server.seneca
          .use("mesh", Object.assign(config.seneca || {}, _config))
          .use("seneca-as-promised");

        server.seneca.ready(() => {
          server.register(
            [
              {
                register: require("hapi-router"),
                options: {
                  routes: "lib/routes/**/*.js"
                }
              },
              require("vision"),
              require("inert"),
              require("lout")
            ],
            err => {
              assert.ifError(err);
              next();
            }
          );
        });
      }
    );
  } else {
    return cb(server);
  }
}

if (!module.parent) {
  register(function() {});
}

module.exports = register;
