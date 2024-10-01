const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

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

// Implement gRPC service method
function processPayment(call, callback) {
  const { order_id, amount } = call.request;
  console.log(`Received payment request for order ID: ${order_id}, amount: ${amount}`);

  // Simulate payment processing and generate transaction ID
  const transaction_id = Math.floor(Math.random() * 1000000).toString();
  const response = { transaction_id: transaction_id, success: true };
  callback(null, response);
}

// Create gRPC server
const server = new grpc.Server();
server.addService(ecommerce.PaymentService.service, { processPayment });

// Start server
const PORT = process.env.PORT || 50053;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`Payment service gRPC server running at http://localhost:${PORT}`);
  server.start();
});
