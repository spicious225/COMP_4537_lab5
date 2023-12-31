const http = require('http');
const url = require('url');
const mysql = require('mysql2/promise'); // Use 'mysql2/promise' for asynchronous database operations
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cors = require("cors"); // Require the 'cors' package

const port = process.env.PORT || 5000;
const database = require("./MySQLdatabaseconnection.js");

async function createPool() {
    // Create the 'patients' table if it doesn't exist
    await database.query(`
      CREATE TABLE IF NOT EXISTS patients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          dateofbirth DATE NOT NULL
      ) ENGINE=InnoDB;
  `);
}


createPool();

const corsOptions = {
  origin: 'https://ceskrfglxz.us14.qoddiapp.com',
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type'
};


// Create an HTTP server
const server = http.createServer((req, res) => {
    // Use the cors middleware to enable CORS
    cors(corsOptions)(req, res, () => {

        const reqUrl = url.parse(req.url, true);

        if (req.method === "POST" && reqUrl.pathname === "/api/v1/sql/insert") {

            // Read data from the request body
            let body = ''; // Initialize 'body' variable

            req.on('data', (chunk) => {
                body += chunk;
            });

            req.on('end', () => {
                // Parse the JSON data from the request body
                const data = JSON.parse(body);
                console.log("DATA", data);

                const name = data.name;
                const dateofbirth = data.dateofbirth;

                const insertSQL = "INSERT INTO patients (name, dateofbirth) VALUES (?, ?)";
                const values = [name, dateofbirth];

                database.query(insertSQL, values, (err, results) => {
                    if (err) {
                        res.writeHead(500, {
                            "Content-Type": "text/plain"
                        });
                        res.end("Error inserting rows: " + err.message);
                    } else {
                        res.writeHead(200, {
                            "Content-Type": "application/json"
                        });
                        res.end(JSON.stringify({
                            insertedRows: results.affectedRows
                        }));
                    }
                });
            });

        } else if (req.method === "GET" && reqUrl.pathname.startsWith("/api/v1/sql/select")) {
          const query = reqUrl.query.query;
          
          if (!query) {
              res.writeHead(400, {
                  "Content-Type": "text/plain"
              });
              return res.end("Query parameter missing or invalid");
          }
      
          database.query(query)
              .then(results => {
                  res.writeHead(200, {
                      "Content-Type": "application/json"
                  });
                  res.end(JSON.stringify(results[0]));
              })
              .catch(err => {
                  console.error("Database error:", err); // Log the error to the console for debugging
                  res.writeHead(500, {
                      "Content-Type": "text/plain"
                  });
                  res.end("Error executing query: " + err.message);
              });
      }
      
    });
});

// Listen on a specific port
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});