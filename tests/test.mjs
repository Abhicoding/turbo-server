import fetch from 'node-fetch'
import test from 'tape'
import App from '../lib/server'

// Start App Server
const app = new App()
const router = new App.Router('/')

router.post('/', function () {
  this.res.send(this.body)
})

router.post('/cookie', function () {
  this.res.setCookie(this.body.name, this.body.value, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7 // 1 week
  })
  this.res.send(this.body)
})

router.get('/redirect', function () {
  this.res.redirect('/wonderland')
})

router.post('/urlencoded', function () {
  this.res.send(this.body)
})

app.addRouter(router)

app.listen() // process.env.PORT || 5000

test('responds to requests', async (t) => {
  t.plan(18)
  let res, data, error

  try {
    res = await fetch('http://127.0.0.1:5000/aa')
    data = await res.text()
  } catch (e) {
    error = e
  }
  t.false(error)
  t.equal(res.status, 404)
  t.equal(data, 'Not Found')

  try {
    res = await fetch('http://127.0.0.1:5000')
    data = await res.text()
  } catch (e) {
    error = e
  }
  t.false(error)
  t.equal(res.status, 200)
  t.equal(data, '<h1>hello world</h1>\n')

  try {
    res = await fetch('http://127.0.0.1:5000', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({hello: 'world'})
    })
    data = await res.json()
  } catch (e) {
    error = e
  }
  t.false(error)
  t.equal(res.status, 200)
  t.deepEqual(data, {hello: 'world'})

  try {
    res = await fetch('http://127.0.0.1:5000/cookie', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Cookie: 'hello=world; Max-Age=604800; HttpOnly'},
      body: JSON.stringify({name: 'hello', value: 'world'})
    })
    data = res.headers.get('set-cookie')
  } catch (e) {
    error = e
  }
  t.false(error)
  t.equal(res.status, 200)
  t.equal(data, 'hello=world; Max-Age=604800; HttpOnly')

  /// My redirect test
  try {
    res = await fetch('http://127.0.0.1:5000/redirect', {
      redirect: 'manual',
      follow: 0
    })
    data = res.headers.get('Location')
  } catch (e) {
    error = e
  }
  t.false(error)
  t.equal(res.status, 302)
  t.equal(data, 'http://127.0.0.1:5000/wonderland')

  // My urlencoded parser test
  try {
    res = await fetch('http://127.0.0.1:5000/urlencoded', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'input1=hello&input2=world&input3=are+you%3F'
    })
    data = await res.json()
  } catch (e) {
    error = e
  }
  t.false(error)
  t.equal(res.status, 200)
  t.deepEqual(data, {'input1': 'hello', 'input2': 'world', 'input3': 'are you?'})

  // Shutdown App Server
  app.close()
})
