exports.login = function (req, res, next) {
  console.log("Process Login Function");
  if (req.session.username) {
    next();
  } else {
    res.redirect('/login');
  }
};

//this exports login function and checks is there a username session created
//if the session exists it calls next() function to go and execute what is next in line (which is dashboard)
//if the session doesn't exist redirect back to login page

