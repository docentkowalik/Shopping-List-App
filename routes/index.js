var ObjectId = require('mongodb').ObjectID; 

exports.index = function(req, res){
  res.render('dash', {username: req.session.username})
};//index page which renders dashboard

exports.register = function(req, res) {
  res.render('register');
  console.log("Registration");
};

exports.login = function(req, res){
 var msgValue = req.session.loginMsg ? req.session.loginMsg : " ";  //message variable that holds the string of sessions
  res.render('login', {msg: msgValue});                             // which are storing the messages from the processLogin function 
};

exports.dash = function(req, res) {
  var db = req.app.settings.db;   //storing database connection in db variable (db is a global variable in app.js)

  var currentTime = new Date(); //creating new date variable
  var month= currentTime.getMonth() + 1;  //getting the current month
  var day = currentTime.getDate();        //getting the current day
  var year = currentTime.getFullYear();   //getting the current year
  var time = (day + "/" + month + "/" + year);  //creating a daye string and storing it in the time variable
  console.log("current date: " + time);

  var ownerName = req.session.username;   //accessing the username session which was created in the login function
  console.log("Dash Owner: " + ownerName);

  
  db.collection('lists', function (err, listsColl) {  
    // Getting the collection called 'lists' from the database
    if (err) {throw err;}

    listsColl.find({listUser: ownerName}).sort('_id','desc').limit(0).toArray(function(err, listsArr) {
      //finding all lists where the listUser == ownerName
      //the list user is set in the javascript object that you can see inside the addList function
      //and it's value is the name of the owner stored up on the session
      console.log(listsArr);
        if (err) {throw err};
        
        res.render('dash', {lists: listsArr, username: req.session.username, theDate:time, owner: ownerName});
        //rendering the page and passing the array of lists, username, date, and the owner to jade page so they 
        //can be accessed at any time on the dash page.
      });
  });
};

exports.addList = function(req, res) {
  var db = req.app.settings.db; // MONGODB connection
  var newList = req.param('listName');  //getting the value from the input field with the name of listName
  var ownerOfTheList = req.session.username;;
  console.log("owner of the list :" + ownerOfTheList);

  if (!newList)  //if there is no value in newList variable
  {
    res.redirect('/dash');
  }
  else {
    if(req.param('submit') == 'copy'){
      pickAndCopy(req, res);
      req.session.copyListName = newList;

    }
    else {
  
    db.collection('lists', function(err, listCollection) {
      //get the lists collection
    
      var list = {                //here I am creating an object called list with two parameters
        listName: newList,        //list name which is equal to the input field value 
        listUser:ownerOfTheList   //and the listUser equal to the owner(username) of the current list
      };

      listCollection.insert(list, {w:1}, function (err, result) {  // inserting list object into the lists database
        if (err) throw err;

        console.log("Added New List: ", result);
        res.redirect('/dash');
      });
    });
  }}
};

exports.listOfItems = function(req, res) {
//in this function I am going to check if the list id is being passed on teh query string and then
//I am accessiing the items collection and finding all the items in the items collection
//where the listOwner is equal to the object id of the list (the id value that was passes on the query string)
  var db = req.app.settings.db;
  var ListID = req.param('id');

  if (!ListID) {
    res.render('/dash');
  } 
  else {
    var listObjectID = new ObjectId(ListID);
    req.session.listOID = ListID;

    db.collection('items', function (err, itemsCollection) {
      itemsCollection.find({listOwner: listObjectID}).sort('_id','desc').limit(50).toArray(function (err, iremsArr){
        if (err) throw err;

        //in this part bellow I am doing checks for the statusChange function below.
        //every item has a status value set to 0 so when the status icon is clicked I am doing a check and returning a value 
        //back to the jade page, I am going to use that value to toggle between css classes for the status button

        if (iremsArr.length == 0) {
          res.render('listOfItems', {items: iremsArr, title: req.session.titleList});
        }

        else{
              if (iremsArr[0].status == 0) {
                    var zero = iremsArr[0].status;
                    console.log("status: "+ zero + " Item to buy or returned");
                    
                    res.render('listOfItems', {items: iremsArr, title: req.session.titleList, stat: zero});
                  }
          
              if (iremsArr[0].status == 1){
                    var one = iremsArr[0].status;
                    console.log("status 1 "+ one + " Item bought");

                    res.render('listOfItems', {items: iremsArr, title: req.session.titleList, stat: one});
              }
            }
          });
        });
      }
};

exports.deleteList = function (req, res) {
  //in this function I am checking the id of the list that I want to delete and the by accessing the lists
  //collection I am removing the list form the collection based on the _id and then redirecting back to the dashboard
  var db = req.app.settings.db;
  var listId = req.param('listDel');

  if (!listId) {
    res.redirect('/dash');
  } 
  else {
    var listObjectID = new ObjectId(listId);

//this code below is getting all the lists collection and removing the list which id is equal to the list ObjectID

    db.collection('lists', function (err, ListCollection){
      ListCollection.remove({_id: listObjectID}, {w:1}, function (err, result) {
        if (err) throw err;
        console.log("List Removed: ", result);

//when the list is removed also all the items that belonged to this list are being removed form the items collections
//list owner is the property in the items collection inside the item object which is equal to the list objectID so when the list is being removed
//then all the items wwhere the listOwner == listObjectId are removed as well
            db.collection('items', function (err, itemCollection){
              itemCollection.remove({listOwner: listObjectID}, {w:1}, function (err, result) {
                if (err) throw err;
                  console.log("items Removed: ", result);
      res.redirect('/dash');
      });
    });
    });
  });
  }
}

exports.addItem = function(req, res) {
  var db = req.app.settings.db;
  var newItemName = req.param('itemName');  //the value of the input field for adding new item

  var listObjectID = new ObjectId(req.session.listOID);   //current list id that I am using in most functions 
                                                          //abecause it is stored on the session nd its easily accessible

  if (!newItemName) {
    res.redirect('/listOfItems?id='+req.session.listOID);
  } 
  else {
    db.collection('items', function (err, itemsCollection) {  //getting the items collection form mongo db

      var itemNew = {                 //here I am creating new object (item) which has 3 parameters
        itemName: newItemName,        //item name is equal to the value entered in teh input field
        status: 0,                    //status set to 0 will be used for checking the statud(bought or now bought yet)
        listOwner: listObjectID       //and the list owner is the list that owns the item and it is equal to the list ObjectID
      };

      if (err) throw exception;

      itemsCollection.insert(itemNew, {w:1}, function(err, result) {  //inserting the item into the items collection
        if (err) throw err;

        console.log("Added New Item: ", result);

        res.redirect('/listOfItems?id='+req.session.listOID);   
        //most important part happens here where the current list Id that is stored up on the session is passed back to the jade pare
        //on the redirect query string in order for the server to know which list has to be rendered and then it will display all the
        //items again as well as the new item that has been just added, otherwise the server would throw and error not knowing which list
        //he has to render
      });
    });
  }
};

exports.deleteItem = function (req, res) {
  var db = req.app.settings.db;
  var itemId = req.param('id'); // getting the id parameter from the deleteItem link query string 

  if (!itemId) {
    res.redirect('/listOfItems?id='+req.session.listOID); 
  } 
  else {
    var itmObjectID = new ObjectId(itemId);  //id of the current item

    db.collection('items', function (err, itemsCollection){
      itemsCollection.remove({_id: itmObjectID}, {w:1}, function (err, result) { //removing the item form the items collection
        if (err) throw err;                                                       //where the is is equal to the item id;
        console.log("Item Removed: ", result);

        res.redirect('/listOfItems?id='+req.session.listOID);
      });
    });
  }
}

exports.statusChange = function (req, res) {
  //in this function I am finding the item in the items database that the status icon on the jade page is attached to
  //then I am checking the value of the status property 1 or 0 and depending on the value I am updating the database property status
  //eg. when the user adds new item to the list status of that item ==0 but then when the user clicks on the status icon to tick the item(bought)
  //then the status field is updated from 0 to 1

  //the user can also "return" the item by clicking the icon again and then if statement is 
  //checking the array wher the status is 1 and updates the field to 0

  // ------comment------
    //this works and the button is working but I was trying to pass 1 or 2 to the class name ot the image tag,
    //so then based on 1 or 2 value it ment to change the image source, and this works as well I have 2 CSS classes 
    //.img0{
    //width: 35px;
    //height: 35px;
    //}

    //.img1{
    //width: 35px;
    //height: 35px;
    //content:url("/images/yes.png");
    //}
    //the problem is that when the status value is passed to the variable on the jade page it reads the class from the stylesheet but applies it to all 
    //of the status icons so the all become checked or unchecked
    //listOfItems.jade line 52 and also 46 for the line:through effect on the text

  var db = req.app.settings.db;
  var upID = req.param('upid');

  if (!upID) {
    res.redirect('/listOfItems?id='+req.session.listOID);
  } 
  else {
    var itemObjectID = new ObjectId(upID);
    
    db.collection('items', function (err, itemsCollection) {
    if (err) throw err;

    itemsCollection.find({_id: itemObjectID}).toArray(function (err, arrresult) {
    if (err) throw err;

      if (arrresult[0].status == 0) {
            
            itemsCollection.update({_id: itemObjectID}, { $set: { status: 1 }}, {w:1}, function (err, doc) {
              if (err) throw err;
              res.redirect('/listOfItems?id='+req.session.listOID);
            });
      }
          
      if (arrresult[0].status == 1){

           itemsCollection.update({_id: itemObjectID}, { $set: { status: 0 }}, {w:1}, function (err, doc) {
              if (err) throw err;
              res.redirect('/listOfItems?id='+req.session.listOID);
              });
      }
    });
  });
 }
}

exports.processRegister = function(req, res) {
  // function for the registratin of the user
  var db = req.app.settings.db;
  var uname = req.param('username');  //getting two values from the form by accessing the name="username" 
  var pwd = req.param('password');    //getting two values from the form by accessing the name="password" 

  if (uname && pwd) //checking if two values are entered
  {
    db.collection('users', function(err, collection) {  //getting the users collection

      var aUserDoc = {    //creating and object for the user where the username and password are equal to what the user entered in the registration form input field
        username: uname,
        password: pwd
      };

      collection.insert(aUserDoc, {w:1}, function (err, result) { //inserting user into the users collection
        if (err) throw err;

        console.log("Registered User: ", result);
        res.redirect('/dash');
      });
    });
  }
};

exports.processLogin = function (req, res) {
  //process login lunction checking are the username and password values entered in the login form 
  //then finding the username where the username == to the value entered in the username field

  var db = req.app.settings.db;

  var uname = req.param('uname');
  var pwd = req.param('pwd');

  if (uname || pwd) {
    db.collection('users', function (err, collection) {
      if (err) throw err;

      collection.find({username : uname}).toArray(function (err, arrayOfDocs) {
        if (err) throw err;

        if (arrayOfDocs.length == 0) {    //if the array is empty and the user hasn't been found redirect to the login page and send a message about it
          req.session.loginMsg = "Sorry. User not found";
          res.redirect('/login');
        }

        else {
          if (arrayOfDocs[0].password == pwd) {           //if the array is not empty get the value of password and compare it with the password value entered in the 
            var ownerName = req.session.username = uname; //with the password value entered in the  login password field and if they match redirect to the dashboard
            res.redirect('/dash');                        
          }
          
          else {
            req.session.loginMsg = "Sorry. Wrong password.";   //but if the values don't match redirect back to the login page and send 
            res.redirect('/login');                            //a message password doesn't match
          }
        }
      });
    });
  }
    else {
      req.session.loginMsg = "Both fields are required";        //if nothing has been entered in the login form redirect back to the login page and send
      res.redirect('/login');                                   //a message that both fields are reqired in order to log in
    }
 };

exports.logoutUser = function (req, res) {
  if (req.session.username){            //check if the session for the user eqists
    delete req.session.username;        //if it does exists delete it and render login page
  }                                     //then authorisation middleware will prevent the users form going to the restricted pages again
    console.log("User Logged Out");
    res.render('login');
};

var pickAndCopy = function (req, res) {
  var db = req.app.settings.db;

  // Get the value of the person form input field and store it on the session, we'll need it
  // later
  var newListName = req.param('newListName');
  req.session.newListName = newListName;
  var ownerName = req.session.username;   //accessing the username session which was created in the login function


  db.collection('lists', function (err, listsCollection) {
    if (err) throw err;

    listsCollection.find({listUser: ownerName}).limit(50).toArray(function(err, resultsArray){
      if (err) {throw err};

      res.render('pickAndCopy', { listsArray: resultsArray });
    })
  });
};

exports.copyList = function (req, res) {
  var db = req.app.settings.db;
  var listToCopyID = req.param('newListName');
  var listToCopyObjectID = new ObjectId(listToCopyID);
  var copiedListName =  req.session.copyListName;
  var ownerOfTheList = req.session.username;

    db.collection('lists', function (err, listCollection) {
    listCollection.insert({listName: copiedListName,  listUser:ownerOfTheList  }, {w:1}, function (err, insertedDocs) {
      if (err) throw err;

      var newListOID = insertedDocs[0]._id;

      db.collection('items', function (err, itemsCollection) {
        if (err) throw err;

        itemsCollection.find({listOwner: listToCopyObjectID}).limit(50).toArray(function(err, resultsArray){
          for (var i=0; i < resultsArray.length; i++) {
            resultsArray[i].listOwner = newListOID;
            delete resultsArray[i]._id;
          }

          itemsCollection.insert(resultsArray, {w:1}, function (err, result) {
            if (err) throw err;

            res.redirect('/listOfItems?id='+newListOID)
          });
        });
      });
    });
  });
};

