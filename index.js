let express = require('express')
let app = express();
let bodyParser = require('body-parser');
let path = require('path');

const expressHbs = require('express-handlebars');

app.engine(
    'hbs',
    expressHbs({
      layoutsDir: 'views/',
      defaultLayout: 'index',
      extname: 'hbs'
    })
  );
  app.set('view engine', 'hbs');
  app.set('views', 'views');

  app.use(bodyParser.urlencoded({ extended: false })) // middleware

    // parse application/json
    app.use(bodyParser.json()) // middleware

  let playerRoutes = require('./routes/homepage');
  app.use(express.static(path.join(__dirname,'public')));

    app.use(playerRoutes);
    let port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Server ready'))