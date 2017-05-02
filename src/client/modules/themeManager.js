/**
 * BetterDiscord Theme Manager
 * Copyright (c) 2015-present Jiiks - https://jiiks.net
 * All rights reserved.
 * https://github.com/Jiiks/BetterDiscordApp - https://betterdiscord.net
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
*/

const Settings = require('./settings');
const Utils = require('./utils');
const Logger = require('./logger');
const { $ } = require('../vendor');

const Theme = require('../themes/theme');
const ThemeStorage = require('../themes/storage');

const Themes = {};

class ThemeManager {

    constructor() {
        let self = this;
        self.themePath = `${Settings.settings.basePath}/themes`;
        self.loadThemes(() => { });
    }

    loadThemes(cb) {
        let self = this;
        Utils.readDir(self.themePath, files => {
            if (!files) {
                cb(Themes);
                return;
            }
            files.forEach(file => {
                self.loadTheme(file, false);

            });

            cb(Themes);
        });
    }

    loadTheme(name, reload) {
        let self = this;

        if (Themes.hasOwnProperty(name) && !reload) {
            Logger.log('ThemeManager', `Attempted to load already loaded theme: ${name}`, 'warn');
            return;
        }

        let basePath = `${self.themePath}/${name}`;

        let config = Utils.tryParse(Utils.readFileSync(`${basePath}/config.json`));

        if (!config) {
            Logger.log('ThemeManager', `Failed to load config for: ${name}`, 'err');
            return;
        }

        Utils.readDir(basePath, files => {

            let themeFile = files.find(file => file.endsWith('.css'));
            if (!themeFile) {
                Logger.log('ThemeManager', `Attempted to load theme that does not seem to exist: ${name}`, 'err');
                return;
            }

            let css = Utils.readFileSync(`${basePath}/${themeFile}`);
            if (!css) {
                Logger.log('ThemeManager', `Failed to parse theme: ${name}`, 'err');
                return;
            }

            let storage = new ThemeStorage(basePath, config.defaultSettings);
            let theme = new Theme(Object.assign(config.info, { 'css': css }));

            theme.storage = storage;
            theme.presets = config.presets;

            Themes[name] = theme;


        });

    }

    enableTheme(id) {
        if (!Themes[id]) {
            Logger.log('ThemeManager', `Attempted to enable a theme that is not loaded: ${id}`, 'err');
            return false;
        }
        if (!Themes[id].css) {
            Logger.log('ThemeManager', `Attempted to enable a theme that does not contain valid css: ${id}`, 'err');
            return false;
        }
        if (Themes[id].ref) {
            Logger.log('ThemeManager', `Attempted to enable already enabled theme: ${id}`, 'warn');
            return false;
        }

        let css = Themes[id].css;

        Themes[id].storage.defaultConfig.forEach(setting => {
            css = css.replace(setting.id, setting.value);
        });

        Themes[id].ref = $('<style/>', {
            text: css
        });

        Themes[id].ref.appendTo($('head'));

        return true;
    }

    disableTheme(id) {
        if (!Themes[id]) {
            Logger.log('ThemeManager', `Attempted to disable a theme that is not loaded: ${id}`, 'err');
            return false;
        }
        if (!Themes[id].ref) {
            Logger.log('ThemeManager', `Attempted to disable a theme that is not enabled: ${id}`, 'warn');
            return false;
        }

        Themes[id].ref.remove();
        Themes[id].ref = null;

        return true;
    }

    get themes() {
        return Themes;
    }
}

module.exports = new ThemeManager();