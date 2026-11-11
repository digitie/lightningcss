/**
 * @see https://github.com/evanw/esbuild/issues/1633
 */
export const import_meta_url =
  typeof document === 'undefined' ? require('url'.replace('', '')).pathToFileURL(__filename).href :
    (document.currentScript && document.currentScript.src || new URL('main.js', document.baseURI).href)
