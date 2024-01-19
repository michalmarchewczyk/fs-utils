import express from 'express';
import { engine } from "express-handlebars";
import path from "node:path";

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', 'src/views');

app.use('/css', express.static(path.join(__dirname, './css/')))

app.get('/', (req, res) => {
  res.render('home');
});

const port = process.env.PORT ?? 8080;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
