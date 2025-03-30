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
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config")); // Import from the correct file
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Endpoint to store data on IPFS via Filebase
app.post('/store', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }
        // Add the data to IPFS
        const result = yield config_1.default.add(data);
        // result.path contains the IPFS hash
        console.log('Data stored on Filebase IPFS with hash:', result.path);
        res.json({ ipfsHash: result.path });
    }
    catch (error) {
        console.error('Error storing data on Filebase IPFS:', error);
        res
            .status(500)
            .json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
