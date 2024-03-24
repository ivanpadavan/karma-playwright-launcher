const {devices, webkit, chromium, firefox} = (() => {
    try {
        return require('playwright');
    } catch (e) {
        try {
            return require('playwright-core');
        } catch (e) {
            throw Error('No playwright package installed! Try npm i playwright');
        }
    }
})();

function applyDecorators(self, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator) {
    baseLauncherDecorator(self);
    captureTimeoutLauncherDecorator(self);
    retryLauncherDecorator(self);
}

function pwBrowser(self, name, browserType, headless, args, logger) {
    self.name = self.displayName = name;

    self.on("start", async (url) => {
        const log = logger.create(self.displayName);

        try {
            self._browser = await browserType.launch({ headless, ...args.launchOptions });

            const page = await self._browser.newPage({ ...devices[args.device], ...args.contextOptions });
            const bindings = Object.assign(
                { click: ({ frame }, selector) => frame.locator(selector).click() },
                args.bindings || {}
            );
            await page.goto(url);
            for (const binding in bindings) {
                await page.exposeBinding(binding, bindings[binding]);
            }
        } catch (err) {
            log.error(err);
            self._done("failure");
        }
    });

    self.on("kill", async (done) => {
        const log = logger.create(self.displayName);

        try {
            self._browser && await self._browser.close();
        } catch (err) {
            log.error(err);
        }

        self._done();
        return process.nextTick(done);
    });
}

function ChromiumBrowser(args, logger, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator) {
    applyDecorators(this, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator);
    pwBrowser(this, 'Chromium', chromium, false, args, logger);
}

function ChromiumHeadlessBrowser(args, logger, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator) {
    applyDecorators(this, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator);
    pwBrowser(this, 'ChromiumHeadless', chromium, true, args, logger);
}

function FirefoxBrowser(args, logger, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator) {
    applyDecorators(this, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator);
    pwBrowser(this, 'Firefox', firefox, false, args, logger);
}

function FirefoxHeadlessBrowser(args, logger, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator) {
    applyDecorators(this, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator);
    pwBrowser(this, 'FirefoxHeadless', firefox, true, args, logger);
}

function WebKitBrowser(args, logger, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator) {
    applyDecorators(this, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator);
    pwBrowser(this, 'Webkit', webkit, false, args, logger);
}

function WebKitHeadlessBrowser(args, logger, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator) {
    applyDecorators(this, baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator);
    pwBrowser(this, 'WebkitHeadless', webkit, true, args, logger);
}

module.exports = {
  'launcher:Chromium':         ['type', ChromiumBrowser],
  'launcher:ChromiumHeadless': ['type', ChromiumHeadlessBrowser],
  'launcher:Firefox':          ['type', FirefoxBrowser],
  'launcher:FirefoxHeadless':  ['type', FirefoxHeadlessBrowser],
  'launcher:Webkit':           ['type', WebKitBrowser],
  'launcher:WebkitHeadless':   ['type', WebKitHeadlessBrowser],
}
