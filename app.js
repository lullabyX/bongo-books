const express = require('express');

const app = express();

const shopRoutes = require('./routes/shop')

app.use(shopRoutes);

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
    res.render('404');
});

app.listen(8080);