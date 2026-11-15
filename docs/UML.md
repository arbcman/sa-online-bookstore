# SA Online Bookstore — UML Class Diagram

Matches the classes suggested in the brief (`Customer`, `Book`, `ShoppingCart`, `CartItem`,
`Order`, `OrderItem`) plus `Administrator`, `User`, `Address` and the `OrderStatus` enumeration.
Renders on GitHub, GitLab, VS Code (Markdown preview) and on <https://mermaid.live>.

```mermaid
classDiagram
    direction LR

    class User {
        <<abstract>>
        +String id
        +String firstName
        +String lastName
        +String email
        +String passwordHash
        +String phone
        +Address address
        +Date createdAt
        +login(email, password) bool
        +logout()
        +updateProfile(data) void
        +changePassword(old, new) bool
    }

    class Customer {
        +String role = "customer"
        +register(data) Customer
        +placeOrder(delivery, payment) Order
        +viewOrders() Order[]
        +addToCart(bookId, qty) void
        +updateCartItem(bookId, qty) void
        +removeCartItem(bookId) void
    }

    class Administrator {
        +String role = "admin"
        +addBook(data) Book
        +updateBook(id, data) Book
        +deleteBook(id) void
        +restockBook(id, qty) void
        +updateOrderStatus(orderId, status) void
        +getDashboardStats() Stats
        +getLowStockBooks() Book[]
    }

    class Book {
        +String id
        +String title
        +String author
        +String isbn
        +String genre
        +String publisher
        +int year
        +double price
        +int stock
        +int lowStockAt
        +String description
        +int sold
        +inStock() bool
        +reduceStock(qty) bool
        +increaseStock(qty) void
    }

    class ShoppingCart {
        +String userId
        +CartItem[] items
        +addItem(bookId, qty) void
        +updateQuantity(bookId, qty) void
        +removeItem(bookId) void
        +clear() void
        +subtotal() double
        +itemCount() int
    }

    class CartItem {
        +String bookId
        +int qty
        +lineTotal() double
    }

    class Order {
        +String id
        +String userId
        +String customerName
        +String email
        +OrderItem[] items
        +double subtotal
        +double delivery
        +double vat
        +double total
        +OrderStatus status
        +String paymentMethod
        +Address deliveryAddress
        +Date createdAt
        +cancel() void
        +advanceStatus() void
    }

    class OrderItem {
        +String bookId
        +String title
        +String author
        +double unitPrice
        +int qty
        +lineTotal() double
    }

    class Address {
        +String street
        +String city
        +String governorate
        +String postalCode
        +isValid() bool
    }

    class OrderStatus {
        <<enumeration>>
        Pending
        Processing
        Shipped
        Delivered
        Cancelled
    }

    User <|-- Customer
    User <|-- Administrator
    User "1" *-- "1" Address : has
    Customer "1" *-- "1" ShoppingCart : owns
    ShoppingCart "1" *-- "0..*" CartItem : contains
    CartItem "*" --> "1" Book : references
    Customer "1" o-- "0..*" Order : places
    Order "1" *-- "1..*" OrderItem : contains
    OrderItem "*" --> "1" Book : references
    Order "1" --> "1" OrderStatus : has
```

---

## Relationship notes

| Relationship | Meaning |
|---|---|
| `User <|-- Customer / Administrator` | Inheritance. Both actors share login, profile and password behaviour; only their permissions differ. |
| `Customer 1 *-- 1 ShoppingCart` | Each customer has exactly one cart, destroyed with the account. |
| `ShoppingCart 1 *-- 0..* CartItem` | A cart holds zero or more lines; a line exists only inside its cart. |
| `CartItem * --> 1 Book` | Association: many cart lines may point at the same book. The cart stores `bookId` + `qty`, not a copy of the book. |
| `Customer 1 o-- 0..* Order` | Aggregation: orders outlive the cart and are kept as history. |
| `Order 1 *-- 1..* OrderItem` | Composition: order lines cannot exist without their order. |
| `OrderItem * --> 1 Book` | Association, but **unit price and title are snapshotted** into the line so later price edits don't rewrite old orders. |
| `Order 1 --> 1 OrderStatus` | Status is an enumeration so only valid transitions are possible. |
| `User 1 *-- 1 Address` | Composition, value object. The order keeps its own copy so editing the profile never changes historical deliveries. |

## Mapping to the localStorage store

| Class | Storage | Notes |
|---|---|---|
| `User` / `Customer` / `Administrator` | `sab.users` | One collection, `role` field discriminates |
| `Book` | `sab.books` | CRUD by administrator |
| `ShoppingCart` + `CartItem` | `sab.carts` | `{ userId: [{ bookId, qty }] }` |
| `Order` + `OrderItem` | `sab.orders` | Items embedded in the order (snapshot) |
| `OrderStatus` | enum in `store.js` | `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled` |
| `Address` | embedded in `user.address` and `order.delivery` | copy on order creation |
