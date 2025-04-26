const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js');

const Video = sequelize.define('Video', {
  name: { type: DataTypes.STRING, allowNull: false },
  duration: { type: DataTypes.FLOAT },
  size: { type: DataTypes.INTEGER },
  originalPath: { type: DataTypes.STRING },
  trimmedPath: { type: DataTypes.STRING },
  finalPath: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('uploaded', 'processing', 'rendered'), defaultValue: 'uploaded' },
});

module.exports = Video;
