const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('tools manufacturing server is runing');
})

app.listen(port, () => {
    console.log('this server port number', port);
})