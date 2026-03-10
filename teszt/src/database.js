const mongoose = require("mongoose");

const { connect, Schema, model } = mongoose;

require("dotenv").config();

const URI = process.env.MONGODB_URI;
const Name = process.env.DATABASE_NAME;

connect(URI)
  .then(() => {
    console.log("Connected to MongoDB database successfully.");
  })
  .catch((err) => console.error("Error connecting to MongoDB database:", err));

const Users = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    unique: true,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    trim: true,
  },
  password: { type: String, required: true, minlength: 8 },
  picture: { type: String, required: false, trim: true },
  isAdmin:{type: Boolean , required: true },
});

const Users_model = model("Users", Users);

const Products = new Schema({
  
  productName: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  createdAt: {type: Date , required: true, default: Date.now}
});

const Favorite = new Schema ({
    user:{type: mongoose.Schema.Types.ObjectId,ref:'Users' , required: true },
    product:{type: mongoose.Schema.Types.ObjectId,ref:'Products', required:true},
    favoritedAt: {type: Date , required: true, default: Date.now}
})

const MessageSchema = new Schema({
  fromUser: String,
  toUser: String,
  message: String,
  timestamp: { type: Number, default: Date.now },
  isRead: { type: Boolean, default: false },
});

const Favorite_model  = model("Favorite", Favorite);
const Message_model = model("Message", MessageSchema);

const Products_model = model("Products", Products);

module.exports = {
  Users_model,
  Products_model,
  Message_model,
  Favorite_model,
};
