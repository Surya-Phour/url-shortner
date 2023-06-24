require("dotenv").config();
const express = require('express');
const app = express();
const Url = require('./urlModel'); 
const mongoose = require('mongoose');
const shortid = require("shortid");
const connectionString = process.env.ATLAS_URI;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Home route
app.get('/', async (req, res) => {
    try {
      const urls = await Url.find({});
  
      res.render('index', { urls });
    } catch (err) {
      console.error('Error retrieving URLs:', err);
      res.render('error');
    }
  });
  
  // Add URL route
  app.post('/add', async (req, res) => {
    const { originalUrl, note } = req.body;
  
    try {
      const existingUrl = await Url.findOne({ originalUrl });
  
      if (existingUrl) {
        res.redirect('/');
      } else {
        const shortUrl = shortid.generate();
  
        const url = new Url({
          originalUrl,
          shortUrl,
          note
        });
  
        await url.save();
  
        res.redirect('/');
      }
    } catch (err) {
      console.error('Error adding URL:', err);
      res.render('error');
    }
  });
  
  app.post("/search", async (req, res) => {
    const { searchQuery } = req.body;
  
    try {
      const autocompleteResultsFull = await Url.aggregate([
        {
          $search: {
            index: "url",
            autocomplete: {
              query: searchQuery || "*",
              path: "originalUrl"
            },
          },
        },
      ]);
  
      const autocompleteResultsNote = await Url.aggregate([
        {
          $search: {
            index: "url",
            autocomplete: {
              query: searchQuery || "*",
              path: "note"
            },
          },
        },
      ]);
  
      const urls = [...autocompleteResultsFull, ...autocompleteResultsNote];
      const allUrls = await Url.find();
      res.render("index", { urls, searchQuery });
    } catch (error) {
      console.error("Error in / route:", error);
      res.status(500).send("An error occurred while fetching data.");
    }
  });


  app.get("/autocomplete", async (req, res) => {
    const { q } = req.query;
    console.log(q)
    try {
      const autocompleteResultsFull = await Url.aggregate([
        {
          $search: {
            index: "url",
            autocomplete: {
              query: q || "*",
              path: "originalUrl"
            },
          },
        },
        {
          $limit: 5, 
        },
        {
          $project: {
            _id: 0,
            short: 1,
            note: 1,
          },
        },
      ]);
  
      const autocompleteResultsNote = await Url.aggregate([
        {
          $search: {
            index: "url",
            autocomplete: {
              query: q || "*",
              path: "note"
            },
          },
        }
      ]);
  
      const autocompleteResults = [...autocompleteResultsFull, ...autocompleteResultsNote];
      console.log(autocompleteResults)
      res.json(autocompleteResults);
    } catch (error) {
      console.error("Error in /autocomplete route:", error);
      res.status(500).send("An error occurred while fetching autocomplete results.");
    }
  });
  
  
  
app.post('/shorten', async (req, res) => {
  const { originalUrl, note } = req.body;

  try {
    const existingUrl = await Url.findOne({ originalUrl });

    if (existingUrl) {
      res.render('result', { shortUrl: existingUrl.shortUrl, note: existingUrl.note });
    } else {
      const shortUrl = shortid.generate();

      const url = new Url({
        originalUrl,
        shortUrl,
        note
      });

      await url.save();

      res.render('result', { shortUrl, note });
    }
  } catch (err) {
    console.error('Error shortening URL:', err);
    res.render('error');
  }
});

app.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;

    try {
      const url = await Url.findOne({ shortUrl });
  
      if (url) {
        url.click++;
        await url.save();
  
        res.redirect(url.originalUrl);
      } else {
        res.render('error');
      }
    } catch (err) {
      console.error('Error redirecting to URL:', err);
      res.render('error');
    }
});


const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
