import net from 'node:net'
import crypto from 'node:crypto'

export class RouterosAPI {
  constructor(timeout = 3) {
    this.debug = false
    this.connected = false
    this.port = 8728
    this.timeout = timeout
    this.attempts = 5
    this.delay = 3
    this.socket = null
    this._buffer = Buffer.alloc(0)
    this._dataResolve = null
  }

  connect(ip, login, password) {
    return new Promise((resolve) => {
      this.connected = false

      const attempt = async (retry) => {
        if (retry > this.attempts) {
          return resolve(false)
        }

        try {
          await new Promise((res, rej) => {
            this.socket = new net.Socket()
            this.socket.setTimeout(this.timeout * 1000)
            this._buffer = Buffer.alloc(0)

            this.socket.on('connect', async () => {
              try {
                this.socket.setTimeout(0)

                // Set up data listener for buffered reads
                this.socket.on('data', (chunk) => {
                  this._buffer = Buffer.concat([this._buffer, chunk])
                  if (this._dataResolve) {
                    const fn = this._dataResolve
                    this._dataResolve = null
                    fn()
                  }
                })

                // Try login (works for both old and new RouterOS)
                await this._writeSentence(['/login', '=name=' + login, '=password=' + password])
                const response = await this._readSentence()

                if (response[0] === '!done') {
                  // Check if old-style MD5 challenge is needed
                  const ret = response.find(r => r.startsWith('=ret='))
                  if (ret) {
                    const challenge = ret.substring(5)
                    const md5 = crypto.createHash('md5')
                    const hash = md5.update('\x00' + password + Buffer.from(challenge, 'hex')).digest('hex')
                    await this._writeSentence(['/login', '=name=' + login, '=response=00' + hash])
                    const resp2 = await this._readSentence()
                    if (resp2[0] === '!done') {
                      this.connected = true
                      res()
                    } else {
                      rej(new Error('Login failed (MD5 challenge)'))
                    }
                  } else {
                    this.connected = true
                    res()
                  }
                } else {
                  const msg = response.find(r => r.startsWith('=message='))
                  rej(new Error('Login failed: ' + (msg || response.join(', '))))
                }
              } catch (err) {
                rej(err)
              }
            })

            this.socket.on('error', (err) => rej(err))
            this.socket.on('timeout', () => {
              this.socket.destroy()
              rej(new Error('Connection timeout'))
            })

            this.socket.connect(this.port, ip)
          })
          return resolve(true)
        } catch (err) {
          if (this.debug) console.log('Connect attempt', retry, 'failed:', err.message)
          if (this.socket) {
            this.socket.removeAllListeners()
            this.socket.destroy()
            this.socket = null
          }
          await new Promise(r => setTimeout(r, this.delay * 1000))
          return await attempt(retry + 1)
        }
      }

      attempt(1)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.destroy()
      this.socket = null
    }
    this.connected = false
    this._buffer = Buffer.alloc(0)
    this._dataResolve = null
  }

  async comm(command, params = {}) {
    if (!this.connected) {
      throw new Error('Not connected')
    }

    const words = [command]
    for (const [k, v] of Object.entries(params)) {
      const prefix = k.startsWith('?') ? '' : '='
      words.push(prefix + k + '=' + v)
    }

    await this._writeSentence(words)
    return this._readResponse()
  }

  // --- Internal: Write ---

  _writeSentence(words) {
    return new Promise((resolve, reject) => {
      const parts = []
      for (const word of words) {
        parts.push(this._encodeLength(Buffer.byteLength(word)))
        parts.push(Buffer.from(word))
      }
      // End-of-sentence: zero-length word
      parts.push(Buffer.from([0x00]))

      const data = Buffer.concat(parts)
      if (this.debug) {
        console.log('>>> Write:', words)
      }
      this.socket.write(data, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  _encodeLength(length) {
    if (length < 0x80) {
      return Buffer.from([length])
    } else if (length < 0x4000) {
      const len = length | 0x8000
      return Buffer.from([(len >> 8) & 0xFF, len & 0xFF])
    } else if (length < 0x200000) {
      const len = length | 0xC00000
      return Buffer.from([(len >> 16) & 0xFF, (len >> 8) & 0xFF, len & 0xFF])
    } else if (length < 0x10000000) {
      const len = length | 0xE0000000
      return Buffer.from([(len >> 24) & 0xFF, (len >> 16) & 0xFF, (len >> 8) & 0xFF, len & 0xFF])
    } else {
      return Buffer.from([0xF0, (length >> 24) & 0xFF, (length >> 16) & 0xFF, (length >> 8) & 0xFF, length & 0xFF])
    }
  }

  // --- Internal: Read ---

  // Wait until buffer has at least n bytes
  _waitForBytes(n) {
    return new Promise((resolve, reject) => {
      if (this._buffer.length >= n) {
        return resolve()
      }
      if (!this.socket || this.socket.destroyed) {
        return reject(new Error('Socket closed'))
      }
      this._dataResolve = () => {
        if (this._buffer.length >= n) {
          resolve()
        } else {
          // Still not enough data, wait more
          this._waitForBytes(n).then(resolve).catch(reject)
        }
      }
    })
  }

  async _readBytes(n) {
    await this._waitForBytes(n)
    const result = this._buffer.subarray(0, n)
    this._buffer = this._buffer.subarray(n)
    return result
  }

  async _readWord() {
    const firstByte = (await this._readBytes(1))[0]
    let length

    if (firstByte === 0) {
      return '' // end of sentence
    } else if (firstByte < 0x80) {
      length = firstByte
    } else if (firstByte < 0xC0) {
      const second = (await this._readBytes(1))[0]
      length = ((firstByte & 0x3F) << 8) | second
    } else if (firstByte < 0xE0) {
      const rest = await this._readBytes(2)
      length = ((firstByte & 0x1F) << 16) | (rest[0] << 8) | rest[1]
    } else if (firstByte < 0xF0) {
      const rest = await this._readBytes(3)
      length = ((firstByte & 0x0F) << 24) | (rest[0] << 16) | (rest[1] << 8) | rest[2]
    } else {
      const rest = await this._readBytes(4)
      length = (rest[0] << 24) | (rest[1] << 16) | (rest[2] << 8) | rest[3]
    }

    if (length === 0) return ''
    const data = await this._readBytes(length)
    return data.toString('utf-8')
  }

  // Read one complete sentence (words until zero-length word)
  async _readSentence() {
    const words = []
    while (true) {
      const word = await this._readWord()
      if (word === '') break
      words.push(word)
    }
    if (this.debug) {
      console.log('<<< Read:', words)
    }
    return words
  }

  // Read full API response (sentences until !done or !fatal)
  async _readResponse() {
    const result = []

    while (true) {
      const sentence = await this._readSentence()
      if (sentence.length === 0) continue

      const type = sentence[0]

      if (type === '!re') {
        const item = {}
        for (let i = 1; i < sentence.length; i++) {
          const word = sentence[i]
          if (word.startsWith('=')) {
            const eqIdx = word.indexOf('=', 1)
            if (eqIdx > 0) {
              item[word.substring(1, eqIdx)] = word.substring(eqIdx + 1)
            }
          }
        }
        result.push(item)
      } else if (type === '!done') {
        return result
      } else if (type === '!trap') {
        const errorItem = { _error: true }
        for (let i = 1; i < sentence.length; i++) {
          const word = sentence[i]
          if (word.startsWith('=')) {
            const eqIdx = word.indexOf('=', 1)
            if (eqIdx > 0) {
              errorItem[word.substring(1, eqIdx)] = word.substring(eqIdx + 1)
            }
          }
        }
        result.push(errorItem)
        // Continue reading, !done will follow
      } else if (type === '!fatal') {
        return result
      }
    }
  }

  // Legacy: kept for backward compatibility (used in mikrotik-service.mjs read methods)
  parseResponse(response) {
    const result = []
    let i = -1
    for (const r of response) {
      if (r === '!re') {
        i++
      } else if (r.startsWith('=')) {
        const eqIdx = r.indexOf('=', 1)
        if (eqIdx > 0) {
          const key = r.substring(1, eqIdx)
          const val = r.substring(eqIdx + 1)
          if (!result[i]) result[i] = {}
          result[i][key] = val
        }
      } else if (r === '!trap' || r === '!fatal') {
        if (!result[i]) result[i] = {}
        result[i]._error = true
      }
    }
    return Object.values(result)
  }
}

export default RouterosAPI
