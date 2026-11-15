# Assignment 3 – Inventory and Data Management System

Backend REST API built with Node.js, Express.js, MongoDB, Mongoose and dotenv.

## 1. Requirements
- Node.js and npm
- MongoDB running locally, or a MongoDB Atlas connection string
- VS Code (recommended)

## 2. Setup
1. select the folder
2. Open the folder in VS Code.
3. Open the terminal in VS Code.
4. Run `npm install`.
5. Copy `.env.example` and rename the copy to `.env`.
6. Check that `MONGO_URI` in `.env` contains your MongoDB connection string.
7. Run `npm start`.
8. Open `http://localhost:5000` to check the server.

## 3. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Create a product |
| GET | `/api/products` | Get products |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Update product details |
| PATCH | `/api/products/:id/restock` | Increase stock |
| PATCH | `/api/products/:id/sale` | Record a sale / decrease stock |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/products/low-stock` | Low-stock report |
| GET | `/api/products/category-summary` | Category-wise aggregation |

## 4. Sample product JSON
Use this JSON body for POST `/api/products`:

```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```

## 5. Query examples
- Filter: `/api/products?category=Stationery`
- Search: `/api/products?search=pen`
- Price range: `/api/products?minPrice=50&maxPrice=500`
- Sort: `/api/products?sort=price&order=asc`
- Pagination: `/api/products?page=1&limit=5`
- Combined: `/api/products?category=Stationery&sort=price&order=asc&page=1&limit=5`

## 6. Stock adjustment JSON
Restock or sale body:

```json
{
  "quantity": 5
}
```

For restock, this adds 5 units. For sale, it subtracts 5 units only when sufficient stock is available.

