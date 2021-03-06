import finalHandler from './final-handler'

export default {
  onend () {
    if (this._body) this._body = Buffer.concat(this._body)
    this.next()
  },

  ondata (buf, start, length) {
    if (!this._body) this._body = []
    this._body.push(Buffer.from(buf.slice(start, length + start)))
  },

  next () {
    this.__next = this._next
    let next = this._next.next
    if (next && next.isRouter) {
      next = next.getHandler(this.method, this.url)
    }
    next = next || finalHandler
    this._next = next
    this.__next()
  }
}
