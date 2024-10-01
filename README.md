# gRPC in Node.js: Building a Practical Communication System for Microservices

Learn how to use gRPC in Node.js to build a robust communication system for microservices.

## Flaws in Traditional HTTP Request Approach

Traditional HTTP request methods have several limitations:
- **No Types**: Unclear data structure between different services.
- **JSON Serialization**: Inefficient for performance.
- **Library Dependency**: Need to understand specific libraries like `axios` or `fetch`.
- **Not Language Agnostic**: Different libraries required for different languages (e.g., Java, Go, Rust).

## gRPC Overview

gRPC offers a modern solution for inter-service communication:
- **gRPC**: Open-source RPC framework by Google.
  - Uses HTTP/2 for transport.
  - Uses Protocol Buffers for data serialization.
  - Supports multiple programming languages.

## Protocol Buffers (ProtoBuf)

Protocol Buffers provide an efficient way to serialize structured data where we define our service definitions and messages. This will be like a common interface between the client and server on what to expect from each other; the methods, types, and returns of what each operation would bear.

- **Smaller and Faster**: Compared to JSON or XML.
- **Language Neutral**: Can be used across different programming languages.
- **Machine Readable**: Binary format for efficient data exchange.
- **Provides Generators**: Compile to source code in multiple languages (e.g., Java, Python, C++).
- **Supports Types and Validations**: Define field types and add validations.
- **Less Boilerplate Code**: Source code generators reduce manual coding.
- **Supports RPC Interfaces**: Define RPC service interface in a proto file.

## How RPC Works

Understand the RPC workflow:
1. Client makes a local procedure call to the client stub.
2. Client stub serializes parameters (marshalling) and sends request.
3. Server stub receives request, unmarshalls parameters, and calls the actual procedure.
4. Server stub sends response back to the client stub.
5. Client stub receives response and resumes normal execution.

![RPC Diagram](image.png)

## Creating a Server and Client with gRPC

Steps to create a server and client with gRPC:
1. **Create the service definition and payload structure in the Protocol Buffer (.proto) file.**
2. **Generate the gRPC code from the .proto file by compiling it using `protoc`.**
3. **Implement the server in one of the supported languages.**
4. **Create the client that invokes the service through the Stub.**
5. **Run the server and client(s).**

## Advantages of gRPC

Explore the benefits of using gRPC:
- **High Performance and Safety**: Uses Protocol Buffers and HTTP/2.
- **Duplex Streaming**: Supports simultaneous client and server streaming.
- **First Class Load Balancing**: Built-in feature for backend traffic management.
- **Selective Message Compression**: Turn off compression for non-compressible content.
- **Heavily Optimized**: Continuous benchmarks to ensure performance.
- **Connection Pooling**: Managed channels with states like connected or idle.

## gRPC   Communication Types

Different types of communication supported by gRPC:
- **Unary RPC**: Traditional request-response-style communication.
- **Server Streaming RPC**: Server sends a stream of data to the client's request.
- **Client Streaming RPC**: Client sends a stream of data to the server.
- **Bidirectional Streaming RPC**: Stream messages to both sides with two independent streams.


# Let’s get on to the practical implementation of gRPC, let’s develop an student onboarding system using three Node.JS micro services for inter-microservice communication let’s make use of gRPC

## Microservices Overview

1. **Main microservice (primary)**: Accepts a student onboarding request via a RESTful API endpoint, then communicates with two secondary microservices to process the onboarding. Also offers an endpoint to check the status of an onboarding request.
2. **Degree selector microservice (secondary)**: Communicates with the main microservice to search for degree details.
3. **Onboarding processor microservice (secondary)**: Accepts an onboarding request and provides the current onboarding status based on status change events.

## High-Level Design

The high-level design was created using draw.io.

## Step-by-Step Guide

### Step 1: Create the Project and Install Dependencies

1. Create a parent folder and three subfolders for our microservices via terminal:

    ```sh
    mkdir main degree process
    ```

2. Create a new Node.js project in the parent folder:

    ```sh
    npm init
    # -- or --
    yarn init
    ```

3. Install `@grpc/grpc-js`, `@grpc/proto-loader`, and `express` dependencies:

    ```sh
    npm install @grpc/grpc-js @grpc/proto-loader express
    # -- or --
    yarn add @grpc/grpc-js @grpc/proto-loader express
    ```

4. Install the `concurrently` package to run all microservices:

    ```sh
    npm install concurrently -D
    # -- or --
    yarn add concurrently -D
    ```

### Step 2: Define Services with Protocol Buffers (Protobufs)

1. Create a new directory to store the Protobuf files:

    ```sh
    mkdir protos
    ```

2. Create a Protobuf file for the communication between the main microservice and the degree selector. Add the following content to the `./protos/degree.proto` file:

    ```proto
    syntax = "proto3";

    service Degrees {
      rpc Find (DegreeId) returns (Degree) {}
    }

    message DegreeId {
      uint32 id = 1;
    }

    message Degree {
      uint32 id = 1;
      string title = 2;
      string major = 3;
    }
    ```

3. Add the following definition to the `./protos/processing.proto`:

    ```proto
    syntax = "proto3";

    service Processing {
      rpc Process (OnboardRequest) returns (stream OnboardStatusUpdate) {}
    }

    message OnboardRequest {
      uint32 degreeId = 1;
      uint32 orderId = 2;
    }

    enum OnboardStatus {
        NEW = 0;
        QUEUED = 1;
        PROCESSING = 2;
        DONE = 3;
    }

    message OnboardStatusUpdate {
      OnboardStatus status = 1;
    }
    ```

### Step 3: Create gRPC Servers

1. Create the degree selector microservice. Add the following code to `./degree/main.js`:

    ```javascript
    const path = require('path');
    const grpc = require('@grpc/grpc-js');
    const protoLoader = require('@grpc/proto-loader');
    const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/degree.proto'));
    const degreeProto = grpc.loadPackageDefinition(packageDefinition);

    const DEGREE = [
        { id: 100, degreeId: 1000, title: 'Engineering', major: 'Electronics' },
        { id: 200, degreeId: 2000, title: 'Engineering', major: 'Computer Science' },
        { id: 300, degreeId: 3000, title: 'Engineering', major: 'Telecommunication' },
        { id: 400, degreeId: 4000, title: 'Commerce', major: 'Accounts' }
    ];

    function findDegree(call, callback) {
        let degree = DEGREE.find((degree) => degree.degreeId == call.request.id);
        if(degree) {
            callback(null, degree);
        } else {
            callback({ message: 'Degree not found', code: grpc.status.INVALID_ARGUMENT });
        }
    }

    const server = new grpc.Server();
    server.addService(degreeProto.Degrees.service, { find: findDegree });
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        server.start();
    });
    ```

2. Create the onboarding processor microservice. Add the following code to `./process/main.js`:

    ```javascript
    const path = require('path');
    const grpc = require('@grpc/grpc-js');
    const protoLoader = require('@grpc/proto-loader');
    const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/processing.proto'));
    const processingProto = grpc.loadPackageDefinition(packageDefinition);

    function process(call) {
        let onboardRequest = call.request;
        let time = onboardRequest.orderId * 1000 + onboardRequest.degreeId * 10;
        call.write({ status: 0 });
        call.write({ status: 1 });
        setTimeout(() => {
            call.write({ status: 2 });
            setTimeout(() => {
                call.write({ status: 3 });
                call.end();
            }, time);
        }, time);
    }

    const server = new grpc.Server();
    server.addService(processingProto.Processing.service, { process });
    server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), () => {
        server.start();
    });
    ```

3. Update your `package.json` with the following code:

    ```json
    "scripts": {
       "start-degree": "node ./degree/main.js",
       "start-processor": "node ./process/main.js",
       "start": "concurrently 'npm run start-degree' 'npm run start-processor'"
    }
    ```

4. Use `npm start` or `yarn start` to start both microservices.

### Step 4: Test gRPC Servers with Postman

1. Download the latest version of Postman for testing gRPC services.

2. Start both secondary microservices using the start npm script. First, we can test the degree selector microservice.

3. Open the Postman app, click **File**, then click **New** (or, press `Ctrl+N`/`Cmd+N`), and create a new gRPC request for `0.0.0.0:50051`.

4. Send the degree identifier to receive a degree object. Use the same steps to test the onboarding processor microservice. It will stream multiple order status change objects via the gRPC server streaming feature.

### Step 5: Create gRPC Client that Communicates with Server

1. Complete the demo student onboarding processing system by implementing a RESTful API for the main microservice. Create a new file in the following path `./main/main.js` and add the below code:

    ```javascript
    const path = require('path');
    const grpc = require('@grpc/grpc-js');
    const protoLoader = require('@grpc/proto-loader');
    const express = require('express');

    const packageDefinitionRec = protoLoader.loadSync(path.join(__dirname, '../protos/degree.proto'));
    const packageDefinitionProc = protoLoader.loadSync(path.join(__dirname, '../protos/processing.proto'));
    const degreeProto = grpc.loadPackageDefinition(packageDefinitionRec);
    const processingProto = grpc.loadPackageDefinition(packageDefinitionProc);

    const degreeStub = new degreeProto.Degrees('0.0.0.0:50051', grpc.credentials.createInsecure());
    const processingStub = new processingProto.Processing('0.0.0.0:50052', grpc.credentials.createInsecure());

    const app = express();
    app.use(express.json());

    const port = 3000;
    let orders = {};

    function processAsync(order) {
        degreeStub.find({ id: order.degreeId }, (err, degree) => {
            if(err) return;

            orders[order.id].degree = degree;
            const call = processingStub.process({
                orderId: order.id,
                degreeId: degree.id
            });
            call.on('data', (statusUpdate) => {
                let statusValue;
                switch (statusUpdate.status) {
                    case 0:
                        statusValue = "NEW"
                        break;
                    case 1:
                        statusValue = "QUEUED"
                        break;
                    case 2:
                        statusValue = "PROCESSING"
                        break;
                    case 3:
                        statusValue = "DONE"
                        break;
                    default:
                        statusValue = "DEFAULT"
                        break;
                }
                orders[order.id].status = statusValue;
            });
        });
    }

    app.post('/studentOnboard', (req, res) => {
        if(!req.body.degreeId) {
            res.status(400).send('Degree identifier is not set');
            return;
        }
        let orderId = Object.keys(orders).length + 1;
        let order = {
            id: orderId,
            status: "NEW",
            degreeId: req.body.degreeId,
            personalDetails: {
                name: req.body.name,
                DOB: req.body.DOB,
                education: req.body.education,
                fatherName: req.body.father
            },
            createdAt: new Date().toLocaleString()
        };
        orders[order.id] = order;
        processAsync(order);
        res.send(order);
    });

    app.get('/onboardingStatus/:id', (req, res) => {
        if(!req.params.id || !orders[req.params.id]) {
            res.status(400).send('Onboarding form not found');
            return;
        }
        res.send(orders[req.params.id]);
    });

    app.listen(port, () => {
        console.log(`API is listening on port ${port}`);
    });
    ```

2. Update the `start` script in `package.json` to run all microservices at once. Use the following script definitions:

    ```json
    "scripts": {
        "start-degree": "node ./degree/main.js",
        "start-processor": "node ./process/main.js",
        "start-main": "node ./main/main.js",
        "start": "concurrently 'npm run start-degree' 'npm run start-processor' 'npm run start-main'"
    }
    ```

3. Run `npm start` or `yarn start` to start the demo student onboarding system.

### Step 6: Test the RESTful API with Postman

1. First, create several orders with `POST /studentOnboard`:

    ```json
    {
        "degreeId": 1000,
        "name": "John Doe",
        "DOB": "1990-01-01",
        "education": "Bachelor's in Science",
        "father": "Robert Doe"
    }
    ```

2. Next, check onboarding status with `GET /onboardingStatus/{orderId}`.

---

This concludes the step-by-step guide for building a student onboarding system using gRPC in Node.js with three microservices.
