const express = require('express')
const dotenv = require('dotenv')
// const chats = require('../backend/data/data')
const connectDB = require('./config/db')
const app = express()
const userRouter = require('./routers/userRouter')
const chatRouter = require('./routers/chatRouter')
const messageRouter = require('./routers/messageRouter')
const User = require('./models/userModel')
const mongoose = require('mongoose')
const path = require('path')

dotenv.config()
app.use(express.json())

const PORT = process.env.PORT || 3000

connectDB()
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)

//----------------------Deployment---------------------------------

// const __dirname1 = path.resolve()

// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname1, '/frontend/build')))

//     app.get('*', (req, res) =>
//         res.sendFile(
//             path.resolve(__dirname1, 'frontend', 'build', 'index.html')
//         )
//     )
// } else {
//     app.get('/', (req, res) => {
//         res.send('API is running..')
//     })
// }

//----------------------Deployment---------------------------------

const server = app.listen(
    PORT,
    console.log(`Server is running on port ${PORT}`)
)

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    // cors: {
    //     origin: 'http://localhost:3000',
    // },
})

io.on('connection', (socket) => {
    console.log('connected to socket.io')

    socket.on('setup', (userData) => {
        socket.join(userData._id)
        socket.emit('connected')
    })

    socket.on('join chat', (room) => {
        socket.join(room)
        console.log('User joined room: ', room)
    })

    socket.on('typing', (room) => socket.in(room).emit('typing'))
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'))

    socket.on('new message', (newMessageRecieved) => {
        var chat = newMessageRecieved.chat

        if (!chat.users) return console.log('chat.users not defined')

        chat.users.forEach((user) => {
            if (user._id == newMessageRecieved.sender._id) return

            socket.in(user._id).emit('message recieved', newMessageRecieved)
        })
    })

    socket.off('setup', () => {
        console.log('USER DISCONNECTED')
        socket.leave(userData._id)
    })
})
