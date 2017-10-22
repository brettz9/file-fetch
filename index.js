const contentTypeLookup = require('mime-types').contentType
const fs = require('fs')
const path = require('path')
const url = require('url')
const Headers = require('node-fetch').Headers
const ReadableError = require('readable-error')

function response (status, body, headers) {
  return {
    status: status,
    headers: new Headers(headers),
    body: body
  }
}

function fetch (iri, options) {
  options = options || {}
  options.method = (options.method || 'GET').toUpperCase()
  options.contentTypeLookup = options.contentTypeLookup || contentTypeLookup

  const pathname = decodeURIComponent(url.parse(iri).pathname)

  if (options.method === 'GET') {
    return Promise.resolve(response(200, fs.createReadStream(pathname), {
      'content-type': options.contentTypeLookup(path.extname(pathname))
    }))
  } else if (options.method === 'PUT') {
    return new Promise((resolve) => {
      if (!options.body) {
        return resolve(response(406, new ReadableError(new Error('body required'))))
      }

      options.body.pipe(fs.createWriteStream(pathname)).on('finish', () => {
        resolve(response(201))
      }).on('error', (err) => {
        resolve(response(500, new ReadableError(err)))
      })
    })
  } else {
    return Promise.resolve(response(405, new ReadableError(new Error('method not allowed'))))
  }
}

fetch.Headers = Headers

module.exports = fetch
