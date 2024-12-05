const express = require('express');
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const userService = require("./user-service.js");

dotenv.config();

const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;
const HTTP_PORT = process.env.PORT || 8080;

// Configure Passport JWT strategy
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        },
        async (jwt_payload, done) => {
            try {
                const user = await userService.getUserById(jwt_payload._id);
                if (user) return done(null, user);
                return done(null, false);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

// Middleware
const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Routes
app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
        .then((msg) => {
            res.json({ "message": msg });
        })
        .catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
        .then((user) => {
            const jwt = require("jsonwebtoken");
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            res.json({ "message": "login successful", token });
        })
        .catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});

// Protected routes
app.get(
    "/api/user/favourites",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.getFavourites(req.user._id)
            .then(data => res.json(data))
            .catch(msg => res.status(422).json({ error: msg }));
    }
);

app.put(
    "/api/user/favourites/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.addFavourite(req.user._id, req.params.id)
            .then(data => res.json(data))
            .catch(msg => res.status(422).json({ error: msg }));
    }
);

app.delete(
    "/api/user/favourites/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.removeFavourite(req.user._id, req.params.id)
            .then(data => res.json(data))
            .catch(msg => res.status(422).json({ error: msg }));
    }
);

app.get(
    "/api/user/history",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.getHistory(req.user._id)
            .then(data => res.json(data))
            .catch(msg => res.status(422).json({ error: msg }));
    }
);

app.put(
    "/api/user/history/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.addHistory(req.user._id, req.params.id)
            .then(data => res.json(data))
            .catch(msg => res.status(422).json({ error: msg }));
    }
);

app.delete(
    "/api/user/history/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.removeHistory(req.user._id, req.params.id)
            .then(data => res.json(data))
            .catch(msg => res.status(422).json({ error: msg }));
    }
);

// Connect to database and start server
userService.connect()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log("API listening on: " + HTTP_PORT);
        });
    })
    .catch((err) => {
        console.log("Unable to start the server: " + err);
        process.exit();
    });
 
