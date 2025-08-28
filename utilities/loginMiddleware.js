module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to perform this action!!");

            // If it’s a review action (POST or DELETE), redirect back to the listing page
        if (req.session.redirectUrl.includes("/reviews")) {
            req.session.redirectUrl = req.session.redirectUrl.split("/reviews")[0];
            //if my url was::/listings/12345/reviews" it becomes:{"/listings/12345"," "} after using split without [0]
            //if my url was::/listings/12345/reviews" it becomes:"/listings/12345" after using split with [0]
        }

        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};
