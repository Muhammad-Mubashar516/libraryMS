const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phoneNumber: { type: String, trim: true },
  address: { street: String, city: String, state: String, zipCode: String },
  issuedBooks: [{ bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }, issuedAt: { type: Date, default: Date.now }, dueDate: { type: Date }, returned: { type: Boolean, default: false }, returnedAt: Date }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});


userSchema.pre('save', async function (next) {
  
  if (!this.isModified('password')) {
    return next();
  }

  try {
    console.log('--- Hashing password for user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('--- Password hashed successfully.');
    next();
  } catch (error) {
    console.error('---!!! ERROR during password hashing !!!---', error);
    
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);