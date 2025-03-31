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
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
// Configure CORS with more specific options
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins - for development only
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
// Middleware
app.use(express_1.default.json());
// Routes
app.post('/upload-file', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { file } = req.body;
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
        const gatewayUrl = `https://${process.env.GATEWAY_URL}/ipfs/${fileHash}`;
        const response = yield fetch(gatewayUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const fileData = yield response.arrayBuffer();
        res.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        const jsonData = JSON.parse(Buffer.from(fileData).toString());
        res.json(jsonData);
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
