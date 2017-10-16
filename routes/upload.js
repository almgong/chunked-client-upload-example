var express = require('express');
var uuid = require('uuid/v4');  // random
var router = express.Router();
var UploadManager = require('../upload-manager');
var NodeRsa = require('node-rsa');

/* GET a token to identify the upload. */
// this is just one way of communicating to the server that you are about to send chunks,
// the only important thing is returning a token to identify the upload with (and will be sent
// with upload requests)
//
// expected GET parameters: totalNumChunks
// optional GET parameters: hashAlg=[md5 | ...], encryptAlg=[rsa | ...]
router.get('/token', function(req, res, next) {
  const token = uuid();
  const response = {};
  let hashAlg;
  let privateKey;

  if (req.query.encryptAlg === 'rsa') {
    // generate a new key pair, defaults 2048-bit keys with 65537 as exponent
    // see: https://github.com/rzcoder/node-rsa
    // pass the public key to the client, and keep the private key in-memory
    const rsaKey = new NodeRsa();
    rsaKey.generateKeyPair();

    encryptAlg = 'rsa';
    privateKey = rsaKey.exportKey('private');

    response.encryptAlg = 'rsa';
    response.encryptPublicKey = rsaKey.exportKey('public');
  }

  if (req.query.hashAlg === 'md5') {
    hashAlg = 'md5';
    response.hashAlg = 'md5';
  }

  response.totalNumChunks = req.query.totalNumChunks;

  UploadManager.registerUpload(token, {
      expectedNumChunks: req.query.totalNumChunks,
      hashAlg: hashAlg,
      privateKey: privateKey
    }
  );

  res.setHeader('Content-Type', 'application/json');
  res.send({ token: token, registered: response });
});

/* POST a chunk */
router.post('/', function(req, res, next) {
  /*
   * Expected format:
   *
   * {
   *   chunkIdentifier: x,
   *   token: xxx-xxx,
   *   data: ...
   * }
   */
  let registered = UploadManager.registerChunk(req.body.token, req.body.chunkIdentifier, req.body.data);

  let message = registered ? 'ok' : 'bad request';
  let statusCode = registered ? 200 : 400;

  res.status(statusCode).send({ status: message });
});

module.exports = router;
