"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const pinata_1 = require("pinata");
const ethers_1 = require("ethers");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
// Routes
app.post('/upload-file', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { file } = req.body;
        // // Convert base64 to buffer
        // const fileBuffer = Buffer.from(file, 'base64')
        // Create a File object directly from the buffer for Pinata SDK
        // This avoids the Blob type error by skipping the Blob creation step
        const fileName = req.body.fileName || 'uploaded-file.json';
        const fileType = req.body.fileType || 'application/json';
        const fileObject = new File([JSON.stringify(file)], fileName, {
            type: fileType,
        });
        const pinata = new pinata_1.PinataSDK({
            pinataJwt: process.env.PINATA_JWT,
            pinataGateway: process.env.GATEWAY_URL,
        });
        const walletAddress = yield ethers_1.ethers.Wallet.createRandom().getAddress();
        // Use the correct method from Pinata SDK
        const result = yield pinata.upload.public.file(fileObject);
        prisma.content.create({
            data: {
                title: fileName,
                tags: ['test'],
                user: {
                    connect: {
                        walletAddress: walletAddress,
                    },
                },
            },
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res
            .status(500)
            .json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}));
app.get('/get-file', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fileHash = req.query.fileHash;
    const pinata = new pinata_1.PinataSDK({
        pinataJwt: process.env.PINATA_JWT,
        pinataGateway: process.env.GATEWAY_URL,
    });
    try {
        if (!fileHash) {
            return res.status(400).json({ error: 'File hash is required' });
        }
        // Construct the gateway URL manually
        const gatewayUrl = `https://${process.env.GATEWAY_URL}/ipfs/${fileHash}`;
        // https://bronze-wrong-aardvark-644.mypinata.cloud/ipfs/
        // Fetch the file from the gateway
        const response = yield fetch(gatewayUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        // Get the raw data instead of trying to parse JSON
        const fileData = yield response.arrayBuffer();
        // Set appropriate headers based on content type
        res.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        // Send the raw file data
        // For JSON data, you could parse it first if needed
        // const jsonData = JSON.parse(Buffer.from(fileData).toString());
        // res.json(jsonData);
        // Parse buffer to JSON and send as JSON response
        const jsonData = JSON.parse(Buffer.from(fileData).toString());
        res.json(jsonData);
        console.log(jsonData);
    }
    catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
