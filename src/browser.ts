/**
 * This file is the entrypoint of browser builds.
 * The code executes when loaded in a browser.
 */
import { Application } from './main'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/* (window as any).app = app; */

if (window === null) {
    throw new Error("Requires browser environment!");
} else {
    document.addEventListener('DOMContentLoaded', function () {
        var app = new Application();
    }, false);
}

