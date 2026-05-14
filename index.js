const cookieParser = require("cookie-parser");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const session = require("express-session");
const passport = require("passport");
require("passport-google-oauth").OAuth2Strategy;

const allowedOrigins = [
	process.env.CLIENT_URL,
	"https://ruthless-jail.surge.sh",
	"http://localhost:3000",
].filter(Boolean);

const corsOptions = {
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		return callback(new Error(`Origin ${origin} is not allowed by CORS`));
	},
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
};

require("./schema/User");
require("./schema/Article");
require("./schema/Profile");

const mongoUri =
	(process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) ||
	`mongodb+srv://dbAdmin:${encodeURIComponent(
		process.env.MONGODB_ADMIN_PASSWORD
	)}@cluster0.vkbul.mongodb.net/?retryWrites=true&w=majority`;

require("./services/passport");

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
	res.on("finish", () => {
		if (req.path !== "/" && req.path !== "/favicon.ico") {
			console.log(`${req.method} ${req.path} -> ${res.statusCode}`);
		}
	});
	next();
});
app.use(
	session({
		secret: "doNotGuessTheSecret",
		resave: true,
		saveUninitialized: true,
	})
);
app.use(passport.initialize());
app.use(passport.session());
require("./routes/authRoutes")(app);
require("./routes/profileRoutes")(app);
require("./routes/followingRoutes")(app);
require("./routes/articleRoutes")(app);

app.use(express.static("frontend/build/"));
app.get("/", (req, res) => {
	console.log("got request " + req.url);
	res.sendFile("./frontend/build/index.html");
});
app.get("/favicon.ico", (req, res) => {
	console.log("got request " + req.url);
	res.sendFile("./frontend/build/favicon.ico");
});

const startServer = async () => {
	try {
		await mongoose.connect(mongoUri);
		console.log("Connected to DB");

		// Get the port from the environment, i.e., Heroku/Render sets it
		const port = process.env.PORT || 4200;
		const server = app.listen(port, () => {
			const addr = server.address();
			console.log(`Server listening at http://${addr.address}:${addr.port}`);
		});
	} catch (err) {
		console.error("Failed to connect to DB:", err);
		process.exit(1);
	}
};

startServer();
