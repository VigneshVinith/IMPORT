const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')

const app = express()
app.use(express.json())

let db = null

const initializeServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const postResgister = `
  SELECT
    *
  FROM
    user
  WHERE
    username = "${username}"`
  const dbUser = await db.get(postResgister)
  if (dbUser === undefined) {
    const createUser = `
    INSERT INTO
      user (username, name, password, gender, location)
    VALUES
    ("${username}",
     "${name}",
     "${hashedPassword}",
     "${gender}",
     "${location}")`

    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const newUser = await db.run(createUser)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const postLogin = `
  SELECT
    *
  FROM
    user
  WHERE
    username = "${username}"`

  const dbUser = await db.get(postLogin)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isMatch = await bcrypt.compare(password, dbUser.password)
    if (isMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkUser = `
  SELECT
    *
  FROM
    user
  WHERE
    username = "${username}"`
  const dbUser = await db.get(checkUser)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isValid = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValid === true) {
      const newPasswordLength = newPassword.length
      if (newPasswordLength < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptNewPassword = await bcrypt.hash(newPassword, 10)
        const updatePassword = `
      UPDATE 
        user
      SET
        password = "${encryptNewPassword}"
      WHERE
        username = "${username}"`
        const newUser = await db.run(updatePassword)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
