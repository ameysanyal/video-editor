const express = require('express');
require('dotenv').config();
const { sequelize } = require('./models');
const videoRoutes = require('./routes/videoRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/rendered', express.static('rendered'));

app.use('/api/videos', videoRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 4050;

sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
