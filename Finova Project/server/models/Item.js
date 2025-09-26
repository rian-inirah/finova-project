module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define('Item', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200]
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        notNull: true
      }
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'items',
    timestamps: true,
    paranoid: true // Soft delete
  });

  Item.associate = (models) => {
    Item.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    Item.hasMany(models.OrderItem, {
      foreignKey: 'itemId',
      as: 'orderItems'
    });
  };

  return Item;
};
