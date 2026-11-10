// Local development server: API + static frontend.
const express = require('express');
const path = require('path');
const app = require('./src/app');

const root = express();
root.use(express.static(path.join(__dirname, 'public')));
root.use(app);

const PORT = process.env.PORT || 3000;
root.listen(PORT, () => console.log(`Notes app running at http://localhost:${PORT}`));
