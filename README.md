# ALRITE Visual Diagnosis Workflow Editor

## Usage Overview

It is recommended to use either Chrome or Firefox. While the editor may work with other browsers, only Chrome and Firefox are extensively tested.

TODO

## Making Changes

Run `tsc npx -w` to tell the TypeScript compiler to watch for changes. Then, open index.html in the browser. Any changes you make the the HTML, CSS or TypeScript should be updated on refresh.

To push changes to production, run `node build/build.js`. This should mirror any changes made to the site to the copy of the site in the `docs` directory, the directory from which the site is served.

If working with the server, run `python -m http.server 8080` to serve the editor at http://localhost:8080/. Otherwise, you may encounter cors issues when exporting if opening the file directly in your browser.