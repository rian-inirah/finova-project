module.exports = (sequelize, DataTypes) => {
  const BusinessDetails = sequelize.define('BusinessDetails', {
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
    businessCategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    fssaiNumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    businessName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        len: [0, 200]
      }
    },
    phoneNumber: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gstinNumber: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    gstSlab: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 28
      }
    },
    gstPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    businessLogo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    reportsPinHash: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'business_details',
    timestamps: true
  });

  BusinessDetails.associate = (models) => {
    BusinessDetails.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return BusinessDetails;
};
