const express = require('express');
require('dotenv').config();
const db = require('./config/db.js');
const videoRoutes = require('./routes/video.route.js');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
require('./workers/renderWorker.js')
require('./workers/notificationWorker.js')

const app = express();
app.use(express.json());
app.use('/uploads', express.static('uploads')); // User-uploaded files 
app.use('/rendered', express.static('rendered')); // Dynamically generated videos

app.use('/api/video', videoRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 4050;

app.get('/', (req,res) =>{
   res.send('welcome to video editor backend')
} )

const initApp = async () => {
  console.log("Testing the database connection..");

  try {
      await db.authenticate();
      console.log("Connection has been established successfully.");
      
      db.sync().then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
      });
      

  } catch (error) {
      console.error("Unable to connect to the database:", error.original);
  }
};

initApp();
