const md5 = require("md5");
const mongoose = require("mongoose");
const redis = require("redis").createClient(process.env.REDIS_URL);

redis.on("error", (err) => {
	console.error("Redis connection error:", err);
});

const User = mongoose.model("users");
const Profile = mongoose.model("profiles");
const passport = require("passport");

const cookieKey = "sid";

const clientUrl = process.env.CLIENT_URL || "https://ruthless-jail.surge.sh";

/**
 * log in a user.
 * @param {*} req
 * @param {*} res
 * @returns
 */
const login = async (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	console.log("login attempt ->", username);

	// supply username and password
	if (!username || !password) {
		console.warn("login failed: missing username or password");
		res.status(400).send("Bad input");
		return;
	}

	let user = await User.findOne({ username: username }).exec();

	if (!user) {
		console.warn("login failed: user not registered ->", username);
		res.status(401).send("User not registered");
		return;
	}

	// validate user
	let hash = md5(user.salt + password);

	if (hash === user.hash) {
		// sets session id and hash cookies
		let sid = md5(new Date().getTime() + user.username);
		// sessionMap[sid] = user;
		console.log("user sign in ->", user);
		redis.hmset("sessions", sid, JSON.stringify(user));
		res.cookie(cookieKey, sid, {
			maxAge: 3600 * 1000,
			httpOnly: true,
			sameSite: "none",
			secure: true,
		});
		let msg = { username: username, result: "success" };
		res.send(msg);
	} else {
		console.warn("login failed: password incorrect ->", username);
		res.status(401).send("Login failed: password incorrect");
	}
	return;
};

/**
 * logout a user.
 * @param {*} req
 * @param {*} res
 */
const logout = (req, res) => {
	let sid = req.cookies.sid;
	let redisCheck = redis.hdel("sessions", sid, (err, data) => {
		if (err) {
			return res.status(500).send("Internal server error");
		}

		console.log("redis remove -> ", data);
		return res.status(200).send("Logged out");
	});

	if (!redisCheck) {
		return res.status(500).send("Internal server error");
	}
};

/**
 * register a user.
 * @param {*} req
 * @param {*} res
 * @returns
 */
const register = async (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	let email = req.body.email;
	let dob = req.body.dob;
	let zipcode = req.body.zipcode;
	let phone = req.body.phone;
	let displayname = "";
	if (req.body.displayname && req.body.displayname !== "") {
		displayname = req.body.displayname;
	}

	// check if we have all required inputs
	if (!username || !password || !email || !dob || !zipcode) {
		res.status(400).send("Bad input");
		return;
	}

	try {
		// check if user is already registered
		const isRegistered = await User.exists({ username: username });
		if (isRegistered) {
			res.status(400).send("Username is taken.");
			return;
		}

		// create a User and register
		let salt = username + new Date().getTime();
		let hash = md5(salt + password);

		const user = await new User({
			username: username,
			salt: salt,
			hash: hash,
		}).save();

		const profile = await new Profile({
			username: username,
			email: email,
			zipcode: zipcode,
			dob: dob,
			phone: phone,
			displayname: displayname,
			headline: "",
			avatar: "",
			following: [],
		}).save();

		// login user
		// sets session id and hash cookies
		let sid = md5(new Date().getTime() + user.username);
		// sessionMap[sid] = user;
		console.log("user sign up ->", user);
		redis.hmset("sessions", sid, JSON.stringify(user));
		res.cookie(cookieKey, sid, {
			maxAge: 3600 * 1000,
			httpOnly: true,
			sameSite: "none",
			secure: true,
		});

		let msg = { result: "success", username: username };
		res.status(200).send(msg);
	} catch (err) {
		return res.status(500).send("Internal server error");
	}
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
const password = async (req, res) => {
	let username = req.user.username;
	let password = req.body.password;

	// check if we have the required input
	if (!password) {
		res.status(400).send("Bad input");
		return;
	}

	try {
		// create a User and register
		let salt = username + new Date().getTime();
		let hash = md5(salt + password);

		const user = await User.findOneAndUpdate(
			{ username: username },
			{ salt: salt, hash: hash },
			{ new: true }
		).exec();

		let msg = { result: "success", username: username };
		res.status(200).send(msg);
	} catch (err) {
		return res.status(500).send("Internal server error");
	}
};

/**
 * validate user logged in
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const isLoggedIn = (req, res, next) => {
	// likely didn't install cookie parser
	if (!req.cookies) {
		console.warn("Auth check failed: request has no cookies object");
		return res.sendStatus(401);
	}

	let sid = req.cookies.sid;
	// no sid for cookie key
	if (!sid) {
		console.warn("Auth check failed: missing sid cookie");
		return res.sendStatus(401);
	}

	// let user = sessionMap[sid];
	let redisCheck = redis.hmget("sessions", sid, (err, data) => {
		if (err) {
			console.error("Auth check failed: Redis lookup error:", err);
			return res.sendStatus(401);
		}
		// no username mapped to sid
		if (data instanceof Array && data.length === 0) {
			console.warn("Auth check failed: Redis returned no session data");
			return res.sendStatus(401);
		}
		let user = data[0];
		if (user && user !== "") {
			req.user = JSON.parse(user);
			next();
		} else {
			console.warn("Auth check failed: session id not found in Redis");
			return res.sendStatus(401);
		}
	});

	if (!redisCheck) {
		console.error("Auth check failed: Redis lookup command was not queued");
		return res.sendStatus();
	}
};

module.exports = (app) => {
	// login POST
	app.post("/login", login);
	// register POST
	app.post("/register", register);

	app.get(
		"/auth/google",
		passport.authenticate("google", {
			scope: ["profile", "email"],
		})
	);

	// Callback handler
	app.get(
		"/auth/google/callback",
		passport.authenticate("google",),
		(req, res) => {
			let user = req.user;
			// sets session id and hash cookies
			let sid = md5(new Date().getTime() + user.username);
			// sessionMap[sid] = user;
			console.log("user loggin from google ->", user);
			redis.hmset("sessions", sid, JSON.stringify(user));
			res.cookie(cookieKey, sid, {
				maxAge: 3600 * 1000,
				httpOnly: true,
				sameSite: "none",
				secure: true,
			});

			res.redirect(`${clientUrl}/main`);
		}
	);

	app.use(isLoggedIn);
	// logout PUT
	app.put("/logout", logout);
	// password PUT
	app.put("/password", password);
};
