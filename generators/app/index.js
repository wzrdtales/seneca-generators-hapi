const Generator = require("yeoman-generator");
const cryptoRandomString = require("crypto-random-string");

module.exports = class extends Generator {
  prompting() {
    return this.prompt([
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this.appname // Default to current folder name
      },
      {
        type: "input",
        name: "description",
        message: "Your project description",
        default: ""
      },
      {
        type: "input",
        name: "configPrefix",
        message: "The environment prefix for your config",
        validate: value => {
          return (
            (value.length && !!value.match(/^[a-zA-Z0-9_]*$/)) ||
            "The prefix may only contain alphanumeric or underscores."
          );
        },
        default: answers => {
          let name = answers.name.replace("-", "_").toLowerCase();
          if (name.match(/^[a-z0-9_]*$/)) return name;
          else return "";
        }
      },
      {
        type: "input",
        name: "cookiename",
        message: "Enter the name of the session cookie",
        default: answers => {
          if (answers.name.match(/^[a-z0-9-_]*$/))
            return `${answers.name}-session`;
          else return "session";
        },
        validate: value => {
          return (
            (value.length && !!value.match(/^[a-zA-Z0-9_-]*$/)) ||
            "The cookiename may only contain alphanumeric or tokens."
          );
        }
      },
      {
        type: "input",
        name: "cookiepassword",
        message: "Enter a cookie password (min 32 chars) or use a random one",
        default: answers => {
          return cryptoRandomString(32);
        },
        validate: answer => {
          return answer.length >= 32 || "Must be at least 32 chars long!";
        }
      },
      {
        type: "input",
        name: "baseName",
        message: "dns of the core for stage and production",
        default: "core"
      },
      {
        type: "input",
        name: "license",
        message: "enter your wished license",
        default: "MIT"
      }
    ]).then(answers => {
      this.props = answers;
    });
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath() + "/**/*",
      this.destinationPath(),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath() + "/**/.*",
      this.destinationPath(),
      this.props
    );

    this.fs.copyTpl(
      this.templatePath("config.js.template"),
      this.destinationPath("config.js"),
      this.props
    );
  }

  install() {
    this.installDependencies({
      bower: false,
      npm: true
    });
  }
};
