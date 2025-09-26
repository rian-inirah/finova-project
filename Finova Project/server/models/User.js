module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'operator'),
      defaultValue: 'operator',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    hooks: {
      beforeCreate: (user) => {
        // Password will be hashed in the controller before saving
      }
    }
  });

  User.associate = (models) => {
    User.hasOne(models.BusinessDetails, {
      foreignKey: 'userId',
      as: 'businessDetails'
    });
    
    User.hasMany(models.Item, {
      foreignKey: 'userId',
      as: 'items'
    });
    
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders'
    });
  };

  return User;
};
