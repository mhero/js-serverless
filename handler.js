"use strict";

require("dotenv").config();

const auth = require("./auth/auth");
const linksService = require("./service/links_service");

// Auth
module.exports.register = auth.register;
module.exports.login = auth.login;

// Links CRUD
module.exports.createLink = linksService.create;
module.exports.getLink = linksService.getOne;
module.exports.getLinks = linksService.getAll;
module.exports.updateLink = linksService.update;
module.exports.deleteLink = linksService.remove;

// Public redirect
module.exports.redirect = linksService.redirect;