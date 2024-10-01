const express = require('express');
const grpc = require('@grpc/grpc-js');
const path = require('path');
const protoLoader = require('@grpc/proto-loader');

const app = express();
app.use(express.json());

// Load the protobuf definition
const PROTO_PATH = path.join(__dirname, '../protos/ecommerce.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const ecommerce = grpcObject.ecommerce;

// Create gRPC client instances for each service
const userServiceClient = new ecommerce.UserService('localhost:50051', grpc.credentials.createInsecure());
const orderServiceClient = new ecommerce.OrderService('localhost:50052', grpc.credentials.createInsecure());
const paymentServiceClient = new ecommerce.PaymentService('localhost:50053', grpc.credentials.createInsecure());

// Example route to fetch user details
app.get('/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);

  userServiceClient.getUser({ user_id: userId }, (err, response) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ error: 'Error fetching user' });
      return;
    }
    res.json({ user: response });
  });
});

// Route to create an order
app.post('/order', (req, res) => {
  const { userId, products } = req.body;

  // Example: Place an order
  const orderRequest = {
    user_id: userId,
    products: products
  };
  orderServiceClient.placeOrder(orderRequest, (err, response) => {
    if (err) {
      console.error('Error placing order:', err);
      res.status(500).json({ error: 'Error placing order' });
      return;
    }
    console.log('Order placed successfully. Order ID:', response.order_id);

    // Example: Process payment for the order
    const paymentRequest = {
      order_id: response.order_id,
      amount: 100.50  // Example amount, should come from request body
    };
    paymentServiceClient.processPayment(paymentRequest, (err, paymentResponse) => {
      if (err) {
        console.error('Error processing payment:', err);
        res.status(500).json({ error: 'Error processing payment' });
        return;
      }
      console.log('Payment processed successfully. Transaction ID:', paymentResponse.transaction_id);
      res.json({ message: 'Order placed and payment processed successfully', orderId: response.order_id, transactionId: paymentResponse.transaction_id });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
