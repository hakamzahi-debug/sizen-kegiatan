/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "0cfa8fd9236aed668c94fad81cb9dc0d"
  }, {
    "url": "pwa-512x512.png",
    "revision": "0cfa8fd9236aed668c94fad81cb9dc0d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "24be5860bb63f9b7a7d5887deed711d9"
  }, {
    "url": "index.html",
    "revision": "395980b24200f26c696a4b47a58ae4bf"
  }, {
    "url": "icon.svg",
    "revision": "dd007b785a591b6e135a626968d9d886"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d80b3fb706617d740fc904bd6ae42407"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/web-D8b0aTIi.js",
    "revision": null
  }, {
    "url": "assets/index-PRJlO_L_.css",
    "revision": null
  }, {
    "url": "assets/index-Dzb14dKP.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d80b3fb706617d740fc904bd6ae42407"
  }, {
    "url": "icon.svg",
    "revision": "dd007b785a591b6e135a626968d9d886"
  }, {
    "url": "pwa-192x192.png",
    "revision": "24be5860bb63f9b7a7d5887deed711d9"
  }, {
    "url": "pwa-512x512.png",
    "revision": "0cfa8fd9236aed668c94fad81cb9dc0d"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "0cfa8fd9236aed668c94fad81cb9dc0d"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6b2821eeb871c9e71cc3b5a3287d5b08"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
