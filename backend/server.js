const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Hello from server. If you see this, the server is working.'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
