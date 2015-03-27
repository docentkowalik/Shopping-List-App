
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var auth = require('./routes/auth');


var app = express();

//mongoDB setup
var mongo = require('mongodb');

var mongoClient = mongo.MongoClient;
var MONGODB_URI = process.env.CUSTOMCONNSTR_MONGODB_URI || 'mongodb://localhost:27017/shoppinglist';

mongoClient.connect(MONGODB_URI, function(err, db) {
  if(!err) {
    console.log("We are connected");
    app.set('db', db);
  }
  else {
    throw err;
  }
});


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('goshopping+++'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
    app.locals.pretty = true;

}

app.get('/', auth.login, routes.index);
app.get('/login', routes.login);
app.post('/login', routes.processLogin);

app.get('/register', routes.register);
app.post('/processRegister', routes.processRegister);

app.get('/logoutUser', routes.logoutUser);

app.get('/dash', auth.login, routes.dash);
app.post('/addList', routes.addList);
app.get('/deleteList', routes.deleteList);

app.get('/listOfItems', routes.listOfItems);
app.post('/addItem', routes.addItem);
app.get('/deleteItem', routes.deleteItem);

app.get('/statusChange', routes.statusChange);

app.post('/copyList', routes.copyList);



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));

});
