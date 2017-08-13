"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");
const yaml = require("js-yaml");
const gracefulExit = require("express-graceful-exit");
const Router = express.Router;

const app = express();

app.use(gracefulExit.middleware(app));

app.get("/", (req, res, next) => {
  req.url = "/index.html";
  next();
});

const interpolateEnvVars = string => {
  for (let key in process.env) {
    let value = process.env[key];
    string = string.replace(new RegExp(`\\\${${key}}`, "gi"), value);
  }
  return string;
};

const getConfig = () => {
  let content = fs.readFileSync(
    path.join(__dirname, process.env.CONFIG_FILE || "config.yml"),
    "utf-8"
  );
  content = interpolateEnvVars(content);

  return content;
};

if (process.env.NODE_ENV == "production") {
  let configuration = null;

  try {
    configuration = yaml.safeLoad(getConfig());
  } catch (err) {
    throw new Error("could not serve config: " + err.message);
  }

  app.get("/config.js", (req, res, next) => {
    res
      .type("application/javascript")
      .send(`window.CONFIG = ${JSON.stringify(configuration)}`);
  });
} else {
  app.get("/config.js", (req, res, next) => {
    let configuration = yaml.safeLoad(getConfig());
    res
      .type("application/javascript")
      .send(`window.CONFIG = ${JSON.stringify(configuration)}`);
  });
}

app.use("/", express.static(path.join(__dirname, "static2")));

const port = process.env.PORT || 8080;
app.listen(port, err => {
  console.log(`listening on ${port}, error: ${err}`);
});
