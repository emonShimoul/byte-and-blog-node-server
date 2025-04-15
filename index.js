require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pabg0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("byteAndBlogDB").collection("users");
    const blogCollection = client.db("byteAndBlogDB").collection("blogs");
    await blogCollection.createIndex({ title: "text" });

    // Users related API
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.patch("/users", async (req, res) => {
      const email = req.body?.email;
      const filter = { email };

      const updatedDoc = {
        $set: {
          lastSignInTime: req.body?.lastSignInTime,
        },
      };

      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Blogs related api
    app.get("/blogs", async (req, res) => {
      // const cursor = blogCollection.find();
      // const result = await cursor.toArray();
      // res.send(result);

      const { category, search } = req.query;
      // console.log("category:", category);
      // console.log("search:", search);

      const query = {};

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$text = { $search: search };
      }

      try {
        const cursor = blogCollection.find(query);
        const result = await cursor.toArray();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch blogs" });
      }
    });
    app.post("/blogs", async (req, res) => {
      const newBlog = req.body;
      const result = await blogCollection.insertOne(newBlog);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Byte and Blog server is running!");
});

app.listen(port, () => {
  console.log(`Byte and Blog is running on port: ${port}`);
});
