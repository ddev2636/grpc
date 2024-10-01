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
function placeOrder(call, callback) {
  const { user_id, products } = call.request;
  console.log(`Received order request for user ID: ${user_id}, products: ${products}`);

  // Simulate order processing and generate order ID
  const order_id = Math.floor(Math.random() * 1000).toString();
  const response = { order_id: order_id };
  callback(null, response);
}

// Create gRPC server
const server = new grpc.Server();
server.addService(ecommerce.OrderService.service, { placeOrder });

// Start server
const PORT = process.env.PORT || 50052;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`Order service gRPC server running at http://localhost:${PORT}`);
  server.start();
});
