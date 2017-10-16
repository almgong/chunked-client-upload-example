const NodeRsa = require('node-rsa');

// in-memory management of uploaded chunks (just for example purposes)
// up to you to save chunks to local/remote fs, S3, database, etc.

class RsaHelper {
  // keyData is the private key contents
  constructor(keyData) {
    this.key = new NodeRsa();
    this.key.importKey(keyData);
  }

  decrypt(cipher) {
    return this.key.decrypt(new Buffer(cipher));
  }
}

let UploadManager = (function() {
  let chunks = {};  // { token/id: { [hashAlg: 'md5', rsaHelper: RsaHelper,] expectedNumChunks: 2, numChunks: 2, chunks: { 0: chunk, 1: chunk } }

  let deregisterUpload = (token) => {
    chunks[token] = null;
  };

  // makes no assumption on existence of all keys, simply naively merges
  // in ascending key order
  let mergeChunks = (token) => {
    let sortedChunkIndexes = Object.keys(chunks[token]['chunks']).sort();

    return sortedChunkIndexes.map((i) => {
      let chunkContent = chunks[token]['chunks'][i];

      // decrypt if needed
      if (chunks[token].rsaHelper instanceof RsaHelper) {
        // note that in NodeRsa, encrypt() puts the cipher in a data attribute
        chunkContent = chunks[token].rsaHelper.decrypt(chunkContent.data).toString();
      }

      return chunkContent;
    }).join('');
  };

  // returns false if there is an already existing registration
  let registerUpload = (token, options) => {
    if (!chunks[token]) {
      chunks[token] = {
        hashAlg: options.hashAlg,
        rsaHelper: options.privateKey ? new RsaHelper(options.privateKey) : null,
        expectedNumChunks: options.expectedNumChunks,
        numChunks: 0,
        chunks: {}
      };

      return true;
    }

    return false;
  };

  // assumes a chunk is not uploaded correctly twice
  // returns false if there already exists a valid chunk for this token and index
  let registerChunk = (token, chunkIndex, chunk) => {
    if (chunks[token] && !chunks[token]['chunks'][chunkIndex]) {

      // TODO: check md5 if needed

      chunks[token]['chunks'][chunkIndex] = chunk;
      chunks[token]['numChunks']++;

      if (chunks[token]['numChunks'] == chunks[token]['expectedNumChunks']) {
        console.log('Received all chunks!');
        console.log(mergeChunks(token));
        deregisterUpload(token);
      }

      return true;
    }

    return false;
  };

  return {
    registerUpload: registerUpload,
    registerChunk: registerChunk
  };
});

managerSingleton = new UploadManager(); // avoid ever doing something like this

module.exports = managerSingleton;