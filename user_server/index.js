const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Load the protobuf definition
const PROTO_PATH = path.join(__dirname, "../protos/ecommerce.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const ecommerce = grpcObject.ecommerce;

// Simulated database or data store for users
const users = [
  { user_id: 1, name: "Alice", email: "alice@example.com" },
  { user_id: 2, name: "Bob", email: "bob@example.com" },
  { user_id: 3, name: "Charlie", email: "charlie@example.com" },
];

// Implement gRPC service methods
function getUser(call, callback) {
  const userId = call.request.user_id;
  console.log(`Received request for user ID: ${userId}`);

  // Find user from database based on userId
  const user = users.find((u) => u.user_id === userId);
  console.log("User :" + user.user_id);

  if (!user) {
    callback({ code: grpc.status.NOT_FOUND, message: "User not found" });
    return;
  }

  const response = { ...user };
  callback(null, response);
}

function updateUser(call, callback) {
  const { user_id, new_email } = call.request;
  console.log(
    `Received update request for user ID: ${user_id}, new email: ${new_email}`
  );

  // Update user in database (simulated)
  const user = users.find((u) => u.user_id === user_id);
  if (!user) {
    callback({ code: grpc.status.NOT_FOUND, message: "User not found" });
    return;
  }

  user.email = new_email;

  const response = { user: user };
  callback(null, response);
}

// Create gRPC server
const server = new grpc.Server();
server.addService(ecommerce.UserService.service, { getUser, updateUser });

// Start server
const PORT = process.env.PORT || 50051;
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log(`User service gRPC server running at http://localhost:${PORT}`);
    server.start();
  }
);
