const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
require("dotenv").config();
const chatRoutes = require("./server/routes/users.routes");
const { authorize } = require("./server/middlewares/auth");
const usersRoutes = require("./server/routes/users.routes");

const app = express();

const { NODE_ENV, PORT, DATABASE_URL } = process.env;

const isDevelopment = NODE_ENV === "development";
const ACTIVE_PORT = PORT || 8000;

if (isDevelopment) {
	app.use(morgan("dev"));
} else {
	app.use(morgan("combined"));
}

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

if (isDevelopment) {
	app.use(cors());
} else {
	app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));
}

app.use("/uploads", express.static("server/uploads"));

app.use("/api", chatRoutes);
app.use("/api/v1/users", authorize, usersRoutes);

if (NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "build")));

	app.get("*", function (req, res) {
		res.sendFile(path.join(__dirname, "build", "index.html"));
	});
}

mongoose
	.connect(DATABASE_URL, {
		useCreateIndex: true,
		useFindAndModify: true,
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		app.listen(ACTIVE_PORT, () => {
			console.log(`DB Connected and the server is running at PORT ${PORT}`);
		});
	})
	.catch(err => {
		console.error("DB Connection Failed", err);
	});
